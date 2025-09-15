import os
import json
import asyncio
from typing import TypedDict, Annotated, List, Dict, Any, Optional
import operator
import pandas as pd
import numpy as np
from uuid import uuid4
from dotenv import load_dotenv

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

# LLM imports
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field, field_validator
from langgraph.graph import StateGraph, END

# Load environment variables
load_dotenv()

try:
    from mp_api.client import MPRester
    MP_API_AVAILABLE = True
except ImportError:
    MP_API_AVAILABLE = False
    print("Warning: mp_api not available. Using sample data only.")

# --- Configuration & FastAPI App Setup ---
app = FastAPI()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize streams storage
if not hasattr(app.state, 'streams'):
    app.state.streams = {}

# --- Agent and Workflow Definition ---

# 1. State Definition
class AgentState(TypedDict):
    user_goal: str
    formalized_objectives: Optional[dict]
    search_query: Optional[dict]
    raw_materials_data: Optional[List[Dict]]
    pareto_front_data: Optional[pd.DataFrame]
    final_report: Optional[str]
    session_id: str

# 2. Pydantic Models for Structured LLM Output
class FormalObjectives(BaseModel):
    """Structured representation of the user's multi-objective goal."""
    objectives: List[str] = Field(description="List of material properties to be optimized (e.g., ['maximize band_gap', 'minimize formation_energy_per_atom']).")
    constraints: Dict[str, Any] = Field(default_factory=dict, description="Dictionary of constraints for the material search (e.g., {'elements': ['Si', 'O'], 'is_stable': True}).")
    search_space_description: str = Field(default="general materials", description="A brief, human-readable description of the chemical space to be explored (e.g., 'stable silicon oxides').")
    
    @field_validator('constraints', mode='before')
    @classmethod
    def validate_constraints(cls, v):
        """Ensure constraints is always a dictionary."""
        if isinstance(v, dict):
            return v
        elif isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                return {"is_stable": True}  # Default constraint
        elif isinstance(v, list):
            return {"elements": v}  # Convert list to elements constraint
        else:
            return {"is_stable": True}  # Default constraint
    
    @field_validator('objectives', mode='before')
    @classmethod
    def validate_objectives(cls, v):
        """Ensure objectives is always a list of strings."""
        if isinstance(v, list):
            return v
        elif isinstance(v, str):
            return [v]
        else:
            return ["maximize band_gap", "minimize formation_energy_per_atom"]

# 3. Agent Nodes
def safe_json_serialize(obj):
    """Safely serialize objects to JSON, handling non-serializable types."""
    if isinstance(obj, (list, tuple)):
        return [safe_json_serialize(item) for item in obj]
    elif isinstance(obj, dict):
        return {str(k): safe_json_serialize(v) for k, v in obj.items()}
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict('records')
    elif isinstance(obj, (pd.Series, np.ndarray)):
        return obj.tolist()
    elif isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif pd.isna(obj):
        return None
    elif hasattr(obj, '__dict__'):
        return str(obj)
    else:
        return obj

async def send_update(session_id: str, data: dict):
    """Helper function to send updates to the correct SSE stream."""
    try:
        if session_id in app.state.streams:
            safe_data = safe_json_serialize(data)
            await app.state.streams[session_id].put(json.dumps(safe_data))
    except Exception as e:
        print(f"Error sending update: {e}")

async def goal_analyst_node(state: AgentState):
    session_id = state['session_id']
    await send_update(session_id, {"agent": "Epimetheus", "status": "thinking", "log": "Parsing your request..."})
    
    prompt = f"""
    You are an expert materials scientist with deep knowledge of materials properties and applications. Analyze the user's research goal and provide a comprehensive, scientifically rigorous response.
    
    User Goal: "{state['user_goal']}"
    
    TASK: Convert this goal into a structured format for materials discovery optimization.
    
    GUIDELINES:
    1. OBJECTIVES: Intelligently identify 2-4 key material properties to optimize based on the user's goal:
       - Electronic: band_gap, formation_energy_per_atom, energy_above_hull, is_metal, is_gap_direct, cbm, vbm, efermi
       - Mechanical: bulk_modulus, shear_modulus, density, universal_anisotropy, homogeneous_poisson
       - Thermal: thermal_conductivity (if available)
       - Magnetic: total_magnetization, is_magnetic, ordering
       - Surface: weighted_surface_energy, weighted_work_function, surface_anisotropy
       - Stability: is_stable, energy_above_hull
       - Structural: volume, nsites, nelements
       - Choose properties that make sense for the user's specific application
    
    2. CONSTRAINTS: Intelligently extract ALL specific requirements from the user's goal:
       - Chemical: elements (extract from compound names, e.g., "copper sulfide" → ["Cu", "S"]), chemsys
       - Stability: is_stable (true/false), energy_above_hull (max value)
       - Electronic: band_gap (0 for metals, >0 for semiconductors), is_metal (true/false)
       - Magnetic: is_magnetic (true/false), ordering ("AFM" for antiferromagnetic, "FM" for ferromagnetic)
       - Structural: nsites, nelements (binary=2, ternary=3, quaternary=4, etc.)
       - Application-specific: density, bulk_modulus, etc.
       - SMART EXTRACTION: Use natural language understanding to extract requirements
       - COMPOUND DETECTION: Recognize compound types (oxides, sulfides, nitrides, etc.)
       - PROPERTY DETECTION: Recognize property requirements (high/low, maximize/minimize)
    
    3. SEARCH SPACE: Provide a detailed description of the target material class based on the user's goal
    
    EXAMPLES:
    For "high-performance semiconductor":
    {{
        "objectives": ["maximize band_gap", "minimize formation_energy_per_atom", "minimize energy_above_hull"],
        "constraints": {{"is_stable": true, "is_metal": false, "band_gap": 0.5}},
        "search_space_description": "stable semiconductors with band gap > 0.5 eV"
    }}
    
    For "lightweight structural material":
    {{
        "objectives": ["minimize density", "maximize bulk_modulus", "minimize formation_energy_per_atom"],
        "constraints": {{"is_stable": true, "density": 10.0}},
        "search_space_description": "stable lightweight materials with density < 10 g/cm³"
    }}
    
    For "magnetic material":
    {{
        "objectives": ["maximize total_magnetization", "minimize formation_energy_per_atom", "minimize energy_above_hull"],
        "constraints": {{"is_stable": true, "is_magnetic": true}},
        "search_space_description": "stable magnetic materials"
    }}
    
    For "thermodynamically stable binary ferromagnetic semiconductor":
    {{
        "objectives": ["maximize band_gap", "maximize total_magnetization", "minimize formation_energy_per_atom"],
        "constraints": {{"is_stable": true, "e_above_hull": 0, "nelements": 2, "is_magnetic": true, "band_gap": {{"$gt": 0}}}},
        "search_space_description": "thermodynamically stable binary ferromagnetic semiconductors"
    }}
    
    For "stable antiferromagnetic ternary copper sulfide that is also a metal":
    {{
        "objectives": ["minimize energy_above_hull", "minimize formation_energy_per_atom", "maximize total_magnetization"],
        "constraints": {{"is_stable": true, "nelements": 3, "elements": ["Cu", "S"], "is_magnetic": true, "is_metal": true, "ordering": "AFM"}},
        "search_space_description": "stable antiferromagnetic ternary copper sulfides that are metallic"
    }}
    
    For "lightweight aerospace alloy":
    {{
        "objectives": ["minimize density", "maximize bulk_modulus", "minimize formation_energy_per_atom"],
        "constraints": {{"is_stable": true, "density": {{"$lt": 5.0}}}},
        "search_space_description": "lightweight stable alloys for aerospace applications"
    }}
    
    For "high-temperature superconductor":
    {{
        "objectives": ["maximize critical_temperature", "minimize formation_energy_per_atom", "minimize energy_above_hull"],
        "constraints": {{"is_stable": true, "is_superconductor": true}},
        "search_space_description": "stable high-temperature superconducting materials"
    }}
    
    For "transparent conducting oxide":
    {{
        "objectives": ["maximize band_gap", "minimize formation_energy_per_atom", "minimize energy_above_hull"],
        "constraints": {{"is_stable": true, "elements": ["O"], "band_gap": {{"$gt": 3.0}}}},
        "search_space_description": "stable transparent conducting oxides with wide band gap"
    }}
    
    For "piezoelectric ceramic":
    {{
        "objectives": ["maximize bulk_modulus", "minimize formation_energy_per_atom", "minimize energy_above_hull"],
        "constraints": {{"is_stable": true, "elements": ["O"]}},
        "search_space_description": "stable piezoelectric oxide ceramics"
    }}
    
    Return ONLY valid JSON with these exact field names: objectives, constraints, search_space_description
    """
    
    try:
        # Get available API keys (prioritize user input, fall back to .env)
        openai_key = os.getenv("OPENAI_API_KEY")
        google_key = os.getenv("GOOGLE_API_KEY")
        
        # Choose model provider based on available keys
        if openai_key and not google_key:
            model_provider = "openai"
        elif google_key and not openai_key:
            model_provider = "gemini"
        elif openai_key and google_key:
            # If both are available, prefer Gemini for better structured output
            model_provider = "gemini"
        else:
            raise Exception("No LLM API keys available")
        
        if model_provider == "openai" and openai_key:
            # OpenAI implementation
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0,
                openai_api_key=openai_key
            )
            structured_llm = llm.with_structured_output(FormalObjectives)
            response = await structured_llm.ainvoke(prompt)
            
            await send_update(session_id, {"agent": "Epimetheus", "status": "success", "log": "Objectives & constraints identified."})
            return {"formalized_objectives": response.model_dump()}
        else:
            if not google_key:
                raise Exception("OpenAI implementation not available and no Google API key")
                
        if model_provider == "gemini" and google_key:
            # Google Gemini implementation
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-pro",
                temperature=0,
                google_api_key=google_key
            )
            structured_llm = llm.with_structured_output(FormalObjectives)
            response = await structured_llm.ainvoke(prompt)
            
            await send_update(session_id, {"agent": "Epimetheus", "status": "success", "log": "Objectives & constraints identified."})
            return {"formalized_objectives": response.model_dump()}
        else:
            raise Exception("No valid LLM API key available")
        
    except Exception as e:
        await send_update(session_id, {"agent": "Epimetheus", "status": "warning", "log": f"LLM parsing failed: {e}. Using default objectives."})
        
        # Fallback to default objectives
        default_objectives = {
            "objectives": ["maximize band_gap", "minimize formation_energy_per_atom"],
            "constraints": {"is_stable": True},
            "search_space_description": "stable semiconductor materials"
        }
        
        await send_update(session_id, {"agent": "Epimetheus", "status": "success", "log": "Using default objectives for demonstration."})
        return {"formalized_objectives": default_objectives}

async def strategy_agent_node(state: AgentState):
    session_id = state['session_id']
    await send_update(session_id, {"agent": "Athena", "status": "thinking", "log": "Formulating data acquisition plan..."})
    
    objectives = state['formalized_objectives']['objectives']
    constraints = state['formalized_objectives']['constraints']
    
    # Enhanced property mapping with more comprehensive coverage
    property_mapping = {
        # Electronic properties
        "critical_temperature": "is_metal",
        "is_superconductor": "is_metal",
        "seebeck_coefficient": "band_gap",
        "power_factor": "band_gap",
        "dielectric_constant": "band_gap",
        "ionic_dielectric_constant": "band_gap",
        "static_dielectric_constant": "band_gap",
        "is_metallic": "is_metal",
        "is_direct_gap": "is_gap_direct",
        "direct_band_gap": "is_gap_direct",
        "indirect_band_gap": "is_gap_direct",
        "transparent": "band_gap",
        "conducting": "is_metal",
        "semiconductor": "band_gap",
        "insulator": "band_gap",
        
        # Mechanical properties
        "bulk_modulus": "bulk_modulus",
        "shear_modulus": "shear_modulus",
        "elastic_anisotropy": "universal_anisotropy",
        "elastic_modulus": "bulk_modulus",
        "young_modulus": "bulk_modulus",
        "poisson_ratio": "homogeneous_poisson",
        "mechanical_stability": "bulk_modulus",
        "stiffness": "bulk_modulus",
        "hardness": "bulk_modulus",
        "lightweight": "density",
        "heavy": "density",
        "dense": "density",
        
        # Thermal properties
        "thermal_conductivity": "density",  # MP doesn't have thermal conductivity
        "thermal_expansion": "density",
        "heat_capacity": "density",
        "high_temperature": "density",
        "low_temperature": "density",
        
        # Magnetic properties
        "curie_temperature": "total_magnetization",
        "magnetic_moment": "total_magnetization",
        "magnetic_ordering": "ordering",
        "magnetization": "total_magnetization",
        "magnetic_susceptibility": "total_magnetization",
        "ferromagnetic": "total_magnetization",
        "antiferromagnetic": "total_magnetization",
        "magnetic": "is_magnetic",
        "non_magnetic": "is_magnetic",
        
        # Surface properties
        "work_function": "weighted_work_function",
        "surface_energy": "weighted_surface_energy",
        "surface_anisotropy": "surface_anisotropy",
        "surface_tension": "weighted_surface_energy",
        
        # Structural properties
        "crystal_system": "symmetry",
        "space_group": "symmetry",
        "space_group_number": "nsites",
        "num_sites": "nsites",
        "lattice_parameter": "volume",
        "unit_cell_volume": "volume",
        "coordination_number": "nsites",
        "binary": "nelements",
        "ternary": "nelements",
        "quaternary": "nelements",
        
        # Stability and formation
        "is_stable": "is_stable",
        "stability": "energy_above_hull",
        "formation_energy": "formation_energy_per_atom",
        "thermodynamic_stability": "energy_above_hull",
        "hull_energy": "energy_above_hull",
        "stable": "is_stable",
        "unstable": "is_stable",
        
        # Piezoelectric properties
        "piezoelectric_coefficient": "bulk_modulus",
        "piezoelectric_modulus": "bulk_modulus",
        "piezoelectric_constant": "bulk_modulus",
        "piezoelectric": "bulk_modulus",
        
        # Optical properties
        "optical_band_gap": "band_gap",
        "absorption_coefficient": "band_gap",
        "refractive_index": "band_gap",
        "transparent": "band_gap",
        "opaque": "band_gap",
        
        # Transport properties
        "electrical_conductivity": "is_metal",
        "carrier_mobility": "band_gap",
        "resistivity": "is_metal",
        "conducting": "is_metal",
        "insulating": "band_gap",
        
        # Application-specific terms
        "aerospace": "density",
        "catalyst": "formation_energy_per_atom",
        "battery": "formation_energy_per_atom",
        "solar": "band_gap",
        "led": "band_gap",
        "laser": "band_gap",
        "ceramic": "elements",
        "alloy": "elements",
        "oxide": "elements",
        "sulfide": "elements",
        "nitride": "elements",
        "carbide": "elements",
    }
    
    fields_to_query = [
        "material_id", "formula_pretty", "energy_above_hull", "formation_energy_per_atom",
        "band_gap", "density", "volume", "is_stable", "is_metal", "total_magnetization",
        "nsites", "nelements", "elements", "chemsys", "symmetry", "is_gap_direct", 
        "cbm", "vbm", "efermi", "is_magnetic", "ordering", "bulk_modulus", "shear_modulus", 
        "universal_anisotropy", "weighted_surface_energy", "surface_anisotropy", 
        "shape_factor", "weighted_work_function", "homogeneous_poisson", "e_total", 
        "e_ionic", "e_electronic", "total_magnetization_normalized_vol", 
        "total_magnetization_normalized_formula_units", "num_magnetic_sites", 
        "num_unique_magnetic_sites", "types_of_magnetic_species"
    ]
    
    for obj in objectives:
        parts = obj.split(" ", 1)
        if len(parts) > 1:
            prop_name = parts[1]
            mapped_prop = property_mapping.get(prop_name, prop_name)
            if mapped_prop not in fields_to_query:
                fields_to_query.append(mapped_prop)
    
    # Clean constraints to only include valid MP API parameters
    valid_mp_constraints = {}
    valid_mp_params = [
        "elements", "chemsys", "material_ids",
        "is_stable", "energy_above_hull", "formation_energy_per_atom",
        "band_gap", "is_metal", "is_gap_direct", "cbm", "vbm", "efermi",
        "nsites", "nelements", "volume", "density", "density_atomic",
        "bulk_modulus", "shear_modulus", "universal_anisotropy",
        "is_magnetic", "ordering", "total_magnetization",
        "weighted_surface_energy", "surface_anisotropy", "shape_factor", "weighted_work_function"
    ]
    
    # Intelligent constraint extraction
    for key, value in constraints.items():
        if key in valid_mp_params:
            valid_mp_constraints[key] = value
        elif key in property_mapping:
            mapped_key = property_mapping[key]
            if mapped_key in valid_mp_params:
                valid_mp_constraints[mapped_key] = value
        # Handle special compound constraints with intelligent parsing
        elif key in ["copper_sulfide", "copper_sulfides", "cu_s", "cus"]:
            valid_mp_constraints["elements"] = ["Cu", "S"]
        elif key in ["iron_oxide", "iron_oxides", "fe_o", "feo"]:
            valid_mp_constraints["elements"] = ["Fe", "O"]
        elif key in ["aluminum_oxide", "aluminum_oxides", "al_o", "alo"]:
            valid_mp_constraints["elements"] = ["Al", "O"]
        elif key in ["titanium_dioxide", "titanium_dioxides", "ti_o", "tio"]:
            valid_mp_constraints["elements"] = ["Ti", "O"]
        elif key in ["silicon_oxide", "silicon_oxides", "si_o", "sio"]:
            valid_mp_constraints["elements"] = ["Si", "O"]
        elif key in ["gallium_nitride", "gallium_nitrides", "ga_n", "gan"]:
            valid_mp_constraints["elements"] = ["Ga", "N"]
        elif key in ["aluminum_nitride", "aluminum_nitrides", "al_n", "aln"]:
            valid_mp_constraints["elements"] = ["Al", "N"]
        elif key in ["zinc_oxide", "zinc_oxides", "zn_o", "zno"]:
            valid_mp_constraints["elements"] = ["Zn", "O"]
        elif key in ["tungsten_carbide", "tungsten_carbides", "w_c", "wc"]:
            valid_mp_constraints["elements"] = ["W", "C"]
        elif key in ["silicon_carbide", "silicon_carbides", "si_c", "sic"]:
            valid_mp_constraints["elements"] = ["Si", "C"]
        # Handle special constraint cases
        elif key == "e_above_hull" and value == 0:
            # Exact energy above hull = 0 constraint
            valid_mp_constraints["energy_above_hull"] = {"$eq": 0.0}
        elif key == "binary_compound":
            # Binary compound constraint (exactly 2 elements)
            valid_mp_constraints["nelements"] = {"$eq": 2}
        elif key == "ternary_compound":
            # Ternary compound constraint (exactly 3 elements)
            valid_mp_constraints["nelements"] = {"$eq": 3}
        elif key == "ferromagnetic":
            # Ferromagnetic constraint (is_magnetic = true)
            valid_mp_constraints["is_magnetic"] = True
        elif key == "antiferromagnetic":
            # Antiferromagnetic constraint (is_magnetic = true, ordering = AFM)
            valid_mp_constraints["is_magnetic"] = True
            valid_mp_constraints["ordering"] = "AFM"
        elif key == "non_metal":
            # Non-metal constraint (band gap > 0)
            valid_mp_constraints["band_gap"] = {"$gt": 0}
        elif key == "metal" or key == "metallic":
            # Metallic constraint (band gap = 0)
            valid_mp_constraints["band_gap"] = {"$eq": 0}
            valid_mp_constraints["is_metal"] = True
        elif key == "semiconductor" or key == "semiconducting":
            # Semiconductor constraint (band gap > 0)
            valid_mp_constraints["band_gap"] = {"$gt": 0}
            valid_mp_constraints["is_metal"] = False
        elif key == "insulator" or key == "insulating":
            # Insulator constraint (large band gap)
            valid_mp_constraints["band_gap"] = {"$gt": 3.0}
            valid_mp_constraints["is_metal"] = False
        elif key == "transparent":
            # Transparent constraint (large band gap)
            valid_mp_constraints["band_gap"] = {"$gt": 3.0}
        elif key == "opaque":
            # Opaque constraint (small band gap or metallic)
            valid_mp_constraints["band_gap"] = {"$lt": 3.0}
        elif key == "lightweight" or key == "low_density":
            # Lightweight constraint
            valid_mp_constraints["density"] = {"$lt": 5.0}
        elif key == "heavy" or key == "high_density":
            # Heavy constraint
            valid_mp_constraints["density"] = {"$gt": 5.0}
        elif key == "high_temperature" or key == "high_temp":
            # High temperature constraint (stable at high T)
            valid_mp_constraints["is_stable"] = True
        elif key == "low_temperature" or key == "low_temp":
            # Low temperature constraint
            valid_mp_constraints["is_stable"] = True
        elif key == "aerospace":
            # Aerospace constraint (lightweight and stable)
            valid_mp_constraints["density"] = {"$lt": 5.0}
            valid_mp_constraints["is_stable"] = True
        elif key == "catalyst" or key == "catalytic":
            # Catalyst constraint (stable and good formation energy)
            valid_mp_constraints["is_stable"] = True
            valid_mp_constraints["formation_energy_per_atom"] = {"$lt": 0}
        elif key == "battery" or key == "electrode":
            # Battery constraint (stable and good formation energy)
            valid_mp_constraints["is_stable"] = True
            valid_mp_constraints["formation_energy_per_atom"] = {"$lt": 0}
        elif key == "solar" or key == "photovoltaic":
            # Solar constraint (appropriate band gap)
            valid_mp_constraints["band_gap"] = {"$gt": 1.0, "$lt": 3.0}
        elif key == "led" or key == "light_emitting":
            # LED constraint (direct band gap)
            valid_mp_constraints["is_gap_direct"] = True
            valid_mp_constraints["band_gap"] = {"$gt": 1.0}
        elif key == "laser":
            # Laser constraint (direct band gap)
            valid_mp_constraints["is_gap_direct"] = True
            valid_mp_constraints["band_gap"] = {"$gt": 1.0}
        elif key == "piezoelectric":
            # Piezoelectric constraint (non-centrosymmetric)
            valid_mp_constraints["is_stable"] = True
        elif key == "ferroelectric":
            # Ferroelectric constraint (non-centrosymmetric)
            valid_mp_constraints["is_stable"] = True
        elif key == "superconductor" or key == "superconducting":
            # Superconductor constraint (metallic)
            valid_mp_constraints["is_metal"] = True
        elif key == "copper_sulfide" or key == "copper_sulfides":
            # Copper sulfide constraint
            valid_mp_constraints["elements"] = ["Cu", "S"]
    
    query = {**valid_mp_constraints, "fields": fields_to_query}
    
    await send_update(session_id, {"agent": "Athena", "status": "success", "log": f"API Query formulated for {len(fields_to_query)} fields with {len(valid_mp_constraints)} constraints: {valid_mp_constraints}"})
    return {"search_query": query}

async def data_agent_node(state: AgentState):
    session_id = state['session_id']
    query = state['search_query']
    await send_update(session_id, {"agent": "Hermes", "status": "thinking", "log": "Accessing Materials Project database..."})
    
    # Check if we have a valid MP API key and the library is available
    mp_api_key = os.getenv("MP_API_KEY")
    if not MP_API_AVAILABLE or not mp_api_key or mp_api_key == "your_materials_project_api_key_here" or mp_api_key == "":
        await send_update(session_id, {"agent": "Hermes", "status": "warning", "log": "No valid MP API key or library not available. Using sample data for demonstration."})
        
        # Return diverse sample materials data
        import random
        all_sample_data = [
            {
                "material_id": "mp-149",
                "formula_pretty": "Si",
                "energy_above_hull": 0.0,
                "band_gap": 1.1,
                "formation_energy_per_atom": -0.5,
                "density": 2.33,
                "volume": 20.02,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Si"],
                "chemsys": "Si",
                "symmetry": "cubic",
                "crystal_system": "cubic",
                "space_group": "Fd-3m",
                "space_group_number": 227,
                "nsites": 8,
                "nelements": 1,
                "is_gap_direct": False,
                "cbm": 0.0,
                "vbm": -1.1,
                "efermi": 0.0,
                "is_magnetic": False,
                "ordering": "",
                "bulk_modulus": 98.0,
                "shear_modulus": 51.0,
                "universal_anisotropy": 0.0,
                "weighted_surface_energy": 1.24,
                "surface_anisotropy": 0.0,
                "shape_factor": 1.0,
                "weighted_work_function": 4.85,
                "homogeneous_poisson": 0.28,
                "e_total": -8.0,
                "e_ionic": -8.0,
                "e_electronic": 0.0,
                "magnetization": 0.0,
                "formation_energy": -0.5,
                "num_sites": 8,
                "work_function": 4.85,
                "elastic_anisotropy": 0.0
            },
            {
                "material_id": "mp-2534",
                "formula_pretty": "SiO2",
                "energy_above_hull": 0.02,
                "band_gap": 9.0,
                "formation_energy_per_atom": -2.2,
                "density": 2.65,
                "volume": 37.99,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Si", "O"],
                "chemsys": "O-Si",
                "symmetry": "hexagonal",
                "crystal_system": "hexagonal",
                "space_group": "P3_221",
                "space_group_number": 154,
                "nsites": 9,
                "nelements": 2,
                "is_gap_direct": False,
                "cbm": 0.0,
                "vbm": -9.0,
                "efermi": 0.0,
                "is_magnetic": False,
                "ordering": "",
                "bulk_modulus": 37.0,
                "shear_modulus": 31.0,
                "universal_anisotropy": 0.0,
                "weighted_surface_energy": 1.0,
                "surface_anisotropy": 0.0,
                "shape_factor": 1.0,
                "weighted_work_function": 5.0,
                "homogeneous_poisson": 0.17,
                "e_total": -19.8,
                "e_ionic": -19.8,
                "e_electronic": 0.0,
                "magnetization": 0.0,
                "formation_energy": -2.2,
                "num_sites": 9,
                "work_function": 5.0,
                "elastic_anisotropy": 0.0
            },
            {
                "material_id": "mp-1265",
                "formula_pretty": "GaN",
                "energy_above_hull": 0.01,
                "band_gap": 3.4,
                "formation_energy_per_atom": -1.1,
                "density": 6.15,
                "volume": 23.77,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Ga", "N"],
                "chemsys": "Ga-N",
                "symmetry": "hexagonal",
                "crystal_system": "hexagonal",
                "space_group": "P6_3mc",
                "space_group_number": 186,
                "nsites": 4,
                "nelements": 2,
                "is_gap_direct": True,
                "cbm": 0.0,
                "vbm": -3.4,
                "efermi": 0.0,
                "is_magnetic": False,
                "ordering": "",
                "bulk_modulus": 200.0,
                "shear_modulus": 95.0,
                "universal_anisotropy": 0.1,
                "weighted_surface_energy": 1.5,
                "surface_anisotropy": 0.05,
                "shape_factor": 1.0,
                "weighted_work_function": 4.2,
                "homogeneous_poisson": 0.36,
                "e_total": -10.5,
                "e_ionic": -10.5,
                "e_electronic": 0.0,
                "magnetization": 0.0,
                "formation_energy": -1.1,
                "num_sites": 4,
                "work_function": 4.2,
                "elastic_anisotropy": 0.1
            },
            {
                "material_id": "mp-3906",
                "formula_pretty": "AlN",
                "energy_above_hull": 0.03,
                "band_gap": 6.2,
                "formation_energy_per_atom": -3.1,
                "density": 3.26,
                "volume": 15.67,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Al", "N"],
                "chemsys": "Al-N",
                "symmetry": "hexagonal",
                "crystal_system": "hexagonal",
                "space_group": "P6_3mc",
                "space_group_number": 186,
                "nsites": 4,
                "nelements": 2,
                "is_gap_direct": True,
                "cbm": 0.0,
                "vbm": -6.2,
                "efermi": 0.0,
                "is_magnetic": False,
                "ordering": "",
                "bulk_modulus": 200.0,
                "shear_modulus": 100.0,
                "universal_anisotropy": 0.0,
                "weighted_surface_energy": 1.8,
                "surface_anisotropy": 0.0,
                "shape_factor": 1.0,
                "weighted_work_function": 4.3,
                "homogeneous_poisson": 0.25,
                "e_total": -12.4,
                "e_ionic": -12.4,
                "e_electronic": 0.0,
                "magnetization": 0.0,
                "formation_energy": -3.1,
                "num_sites": 4,
                "work_function": 4.3,
                "elastic_anisotropy": 0.0
            },
            {
                "material_id": "mp-2538",
                "formula_pretty": "Al2O3",
                "energy_above_hull": 0.0,
                "band_gap": 8.8,
                "formation_energy_per_atom": -2.9,
                "density": 3.97,
                "volume": 25.58,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Al", "O"],
                "chemsys": "Al-O",
                "symmetry": "rhombohedral",
                "crystal_system": "rhombohedral",
                "space_group": "R-3c",
                "space_group_number": 167,
                "nsites": 10,
                "nelements": 2,
                "is_gap_direct": False,
                "cbm": 0.0,
                "vbm": -8.8,
                "efermi": 0.0,
                "is_magnetic": False,
                "ordering": "",
                "bulk_modulus": 250.0,
                "shear_modulus": 150.0,
                "universal_anisotropy": 0.2,
                "weighted_surface_energy": 2.1,
                "surface_anisotropy": 0.1,
                "shape_factor": 1.0,
                "weighted_work_function": 4.8,
                "homogeneous_poisson": 0.23,
                "e_total": -29.0,
                "e_ionic": -29.0,
                "e_electronic": 0.0,
                "magnetization": 0.0,
                "formation_energy": -2.9,
                "num_sites": 10,
                "work_function": 4.8,
                "elastic_anisotropy": 0.2
            }
        ]
        
        # Add some magnetic materials for better testing
        magnetic_materials = [
            {
                "material_id": "mp-13",
                "formula_pretty": "Fe",
                "energy_above_hull": 0.0,
                "formation_energy_per_atom": 0.0,
                "band_gap": 0.0,
                "density": 7.87,
                "volume": 11.78,
                "is_stable": True,
                "is_metal": True,
                "total_magnetization": 2.2,
                "nsites": 2,
                "nelements": 1,
                "elements": ["Fe"],
                "chemsys": "Fe",
                "symmetry": "cubic",
                "crystal_system": "cubic",
                "space_group": "Im-3m",
                "space_group_number": 229,
                "is_gap_direct": False,
                "cbm": 0.0,
                "vbm": 0.0,
                "efermi": 0.0,
                "is_magnetic": True,
                "ordering": "FM",
                "bulk_modulus": 170.0,
                "shear_modulus": 82.0,
                "universal_anisotropy": 0.1,
                "weighted_surface_energy": 2.42,
                "surface_anisotropy": 0.05,
                "shape_factor": 1.0,
                "weighted_work_function": 4.5,
                "homogeneous_poisson": 0.29,
                "e_total": 0.0,
                "e_ionic": 0.0,
                "e_electronic": 0.0,
                "magnetization": 2.2,
                "formation_energy": 0.0,
                "num_sites": 2,
                "work_function": 4.5,
                "elastic_anisotropy": 0.1
            },
            {
                "material_id": "mp-2534",
                "formula_pretty": "FeO",
                "energy_above_hull": 0.0,
                "formation_energy_per_atom": -2.5,
                "band_gap": 2.4,
                "density": 5.7,
                "volume": 20.3,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 4.0,
                "nsites": 4,
                "nelements": 2,
                "elements": ["Fe", "O"],
                "chemsys": "Fe-O",
                "symmetry": "cubic",
                "crystal_system": "cubic",
                "space_group": "Fm-3m",
                "space_group_number": 225,
                "is_gap_direct": False,
                "cbm": 0.0,
                "vbm": -2.4,
                "efermi": 0.0,
                "is_magnetic": True,
                "ordering": "FM",
                "bulk_modulus": 150.0,
                "shear_modulus": 70.0,
                "universal_anisotropy": 0.15,
                "weighted_surface_energy": 1.8,
                "surface_anisotropy": 0.08,
                "shape_factor": 0.9,
                "weighted_work_function": 5.2,
                "homogeneous_poisson": 0.25,
                "e_total": -10.0,
                "e_ionic": -8.0,
                "e_electronic": -2.0,
                "magnetization": 4.0,
                "formation_energy": -5.0,
                "num_sites": 4,
                "work_function": 5.2,
                "elastic_anisotropy": 0.15
            },
            {
                "material_id": "mp-390",
                "formula_pretty": "CrO2",
                "energy_above_hull": 0.0,
                "formation_energy_per_atom": -3.2,
                "band_gap": 1.8,
                "density": 4.9,
                "volume": 18.5,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 2.0,
                "nsites": 6,
                "nelements": 2,
                "elements": ["Cr", "O"],
                "chemsys": "Cr-O",
                "symmetry": "tetragonal",
                "crystal_system": "tetragonal",
                "space_group": "P4_2/mnm",
                "space_group_number": 136,
                "is_gap_direct": True,
                "cbm": 0.0,
                "vbm": -1.8,
                "efermi": 0.0,
                "is_magnetic": True,
                "ordering": "FM",
                "bulk_modulus": 200.0,
                "shear_modulus": 100.0,
                "universal_anisotropy": 0.2,
                "weighted_surface_energy": 2.1,
                "surface_anisotropy": 0.1,
                "shape_factor": 0.85,
                "weighted_work_function": 5.0,
                "homogeneous_poisson": 0.22,
                "e_total": -19.2,
                "e_ionic": -16.0,
                "e_electronic": -3.2,
                "magnetization": 2.0,
                "formation_energy": -9.6,
                "num_sites": 6,
                "work_function": 5.0,
                "elastic_anisotropy": 0.2
            }
        ]
        
        # Combine all sample data
        all_sample_data.extend(magnetic_materials)
        
        # Randomly select 3-4 materials from the sample set
        sample_data = random.sample(all_sample_data, min(4, len(all_sample_data)))
        return {"raw_materials_data": sample_data}
    
    # Try to use MP API with proper error handling
    try:
        await send_update(session_id, {"agent": "Hermes", "status": "thinking", "log": "Connecting to MP database..."})
        
        # Initialize MPRester
        mpr = MPRester(mp_api_key)
        
        # Extract constraints from query
        constraints = {k: v for k, v in query.items() if k != 'fields'}
        fields = query.get('fields', ["material_id", "formula_pretty", "energy_above_hull", "band_gap", "formation_energy_per_atom"])
        
        await send_update(session_id, {"agent": "Hermes", "status": "thinking", "log": f"Querying with constraints: {constraints}"})
        
        # Use the materials endpoint with proper query format
        # Add some randomization to get different results
        import random
        
        # The MP API doesn't support offset in search, so we'll use chunk_size for randomization
        random_chunk_size = random.randint(100, 500)  # Random chunk size to get different materials
        
        # Add some randomization to constraints to get different materials
        randomized_constraints = constraints.copy()
        if 'is_stable' not in randomized_constraints:
            # Randomly add stability constraint to get different materials
            if random.random() < 0.5:
                randomized_constraints['is_stable'] = True
        
        docs = mpr.materials.summary._search(
            **randomized_constraints,
            fields=fields,
            num_chunks=1,
            chunk_size=random_chunk_size
        )
        
        # Convert to list format with proper error handling and safety filters
        data_list = []
        dangerous_elements = {
            'Pu', 'U', 'Th', 'Np', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',  # Actinides
            'Ra', 'Ac', 'Pa', 'Rn', 'Fr', 'At', 'Po', 'Bi', 'Pb', 'Tl', 'Hg', 'Cd',  # Other toxic/radioactive
            'As', 'Se', 'Te', 'Sb', 'Be', 'Cr', 'Ni', 'Co', 'V', 'Mn'  # Toxic metals
        }
        
        for doc in docs:
            # Extract elements safely
            elements = getattr(doc, "elements", [])
            element_set = set(str(e) for e in elements)
            
            # Skip dangerous materials
            if element_set.intersection(dangerous_elements):
                continue
                
            # Safely extract numeric values with proper None handling
            def safe_get_numeric(attr_name, default=None):
                value = getattr(doc, attr_name, default)
                if value is None or (isinstance(value, float) and np.isnan(value)):
                    return default
                try:
                    return float(value) if isinstance(value, (int, float, np.number)) else default
                except (ValueError, TypeError):
                    return default
            
            def safe_get_bool(attr_name, default=False):
                value = getattr(doc, attr_name, default)
                if value is None:
                    return default
                return bool(value)
            
            def safe_get_string(attr_name, default=""):
                value = getattr(doc, attr_name, default)
                if value is None:
                    return default
                return str(value)
            
            material_data = {
                "material_id": safe_get_string("material_id"),
                "formula_pretty": safe_get_string("formula_pretty"),
                "energy_above_hull": safe_get_numeric("energy_above_hull", 0.0),
                "band_gap": safe_get_numeric("band_gap", 0.0),
                "formation_energy_per_atom": safe_get_numeric("formation_energy_per_atom", 0.0),
                "density": safe_get_numeric("density", 0.0),
                "volume": safe_get_numeric("volume", 0.0),
                "is_stable": safe_get_bool("is_stable", True),
                "is_metal": safe_get_bool("is_metal", False),
                "total_magnetization": safe_get_numeric("total_magnetization", 0.0),
                "nsites": safe_get_numeric("nsites", 0),
                "nelements": safe_get_numeric("nelements", 0),
                "elements": [str(e) for e in elements],
                "chemsys": safe_get_string("chemsys"),
                "symmetry": safe_get_string("symmetry"),
                "is_gap_direct": safe_get_bool("is_gap_direct", False),
                "cbm": safe_get_numeric("cbm", 0.0),
                "vbm": safe_get_numeric("vbm", 0.0),
                "efermi": safe_get_numeric("efermi", 0.0),
                "is_magnetic": safe_get_bool("is_magnetic", False),
                "ordering": safe_get_string("ordering"),
                "bulk_modulus": safe_get_numeric("bulk_modulus", 0.0),
                "shear_modulus": safe_get_numeric("shear_modulus", 0.0),
                "universal_anisotropy": safe_get_numeric("universal_anisotropy", 0.0),
                "weighted_surface_energy": safe_get_numeric("weighted_surface_energy", 0.0),
                "surface_anisotropy": safe_get_numeric("surface_anisotropy", 0.0),
                "shape_factor": safe_get_numeric("shape_factor", 0.0),
                "weighted_work_function": safe_get_numeric("weighted_work_function", 0.0),
                "homogeneous_poisson": safe_get_numeric("homogeneous_poisson", 0.0),
                "e_total": safe_get_numeric("e_total", 0.0),
                "e_ionic": safe_get_numeric("e_ionic", 0.0),
                "e_electronic": safe_get_numeric("e_electronic", 0.0),
                # Add mapped properties for compatibility
                "magnetization": safe_get_numeric("total_magnetization", 0.0),
                "formation_energy": safe_get_numeric("formation_energy_per_atom", 0.0),
                "crystal_system": safe_get_string("symmetry"),
                "space_group": safe_get_string("symmetry"),
                "space_group_number": safe_get_numeric("nsites", 0),
                "num_sites": safe_get_numeric("nsites", 0),
                "work_function": safe_get_numeric("weighted_work_function", 0.0),
                "elastic_anisotropy": safe_get_numeric("universal_anisotropy", 0.0)
            }
            
            data_list.append(material_data)
        
        if data_list:
            # Log some sample materials for debugging
            sample_formulas = [mat.get('formula_pretty', 'Unknown') for mat in data_list[:5]]
            await send_update(session_id, {"agent": "Hermes", "status": "success", "log": f"Retrieved {len(data_list)} safe materials from MP database. Sample: {sample_formulas}"})
            return {"raw_materials_data": data_list}
        else:
            await send_update(session_id, {"agent": "Hermes", "status": "warning", "log": "No safe materials found in MP database after filtering. Using sample data."})
            raise Exception("No safe data returned from MP API")
            
    except Exception as mp_error:
        await send_update(session_id, {"agent": "Hermes", "status": "warning", "log": f"MP API error: {mp_error}. Using sample data."})
        # Return sample data as fallback
        sample_data = [
            {
                "material_id": "mp-149",
                "formula_pretty": "Si",
                "energy_above_hull": 0.0,
                "band_gap": 1.1,
                "formation_energy_per_atom": -0.5,
                "density": 2.33,
                "volume": 20.02,
                "is_stable": True,
                "is_metal": False,
                "total_magnetization": 0.0,
                "elements": ["Si"],
                "chemsys": "Si",
                "symmetry": "cubic",
                "nsites": 8,
                "nelements": 1
            }
        ]
        return {"raw_materials_data": sample_data}

async def pareto_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    session_id = state['session_id']
    await send_update(session_id, {"agent": "Hephaestus", "status": "thinking", "log": "Calculating optimal trade-offs..."})
    
    data = state.get('raw_materials_data', [])
    objectives = state.get('formalized_objectives', {}).get('objectives', [])
    constraints = state.get('property_constraints', {})  # <-- new field for ranges
    
    if not data:
        await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No data to analyze."})
        return {"pareto_front_data": pd.DataFrame()}

    df = pd.DataFrame(data)

    # --- Apply property range constraints first ---
    if constraints:
        for prop, (min_val, max_val) in constraints.items():
            if prop in df.columns:
                df = df[(df[prop] >= min_val) & (df[prop] <= max_val)]
        if df.empty:
            await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No materials satisfy the property constraints."})
            return {"pareto_front_data": pd.DataFrame()}

    # --- Advanced objective mapping with intelligent property selection ---
    prop_names, actions, recognized = [], [], []
    
    # Log the original objectives for debugging
    await send_update(session_id, {"agent": "Hephaestus", "status": "info", "log": f"Original objectives: {objectives}"})
    
    # Enhanced mapping with scientific accuracy and flexible interpretation
    objective_mapping = {
        # Electronic properties
        "band_gap": ("band_gap", "maximize"),
        "formation_energy_per_atom": ("formation_energy_per_atom", "minimize"),
        "energy_above_hull": ("energy_above_hull", "minimize"),
        "is_metal": ("is_metal", "minimize"),  # Usually want non-metals for semiconductors
        "is_gap_direct": ("is_gap_direct", "maximize"),
        "cbm": ("cbm", "maximize"),
        "vbm": ("vbm", "maximize"),
        "efermi": ("efermi", "maximize"),
        
        # Mechanical properties
        "bulk_modulus": ("bulk_modulus", "maximize"),
        "shear_modulus": ("shear_modulus", "maximize"),
        "density": ("density", "minimize"),
        "universal_anisotropy": ("universal_anisotropy", "minimize"),
        "homogeneous_poisson": ("homogeneous_poisson", "minimize"),
        "stiffness": ("bulk_modulus", "maximize"),
        "hardness": ("bulk_modulus", "maximize"),
        "lightweight": ("density", "minimize"),
        "heavy": ("density", "maximize"),
        
        # Magnetic properties
        "total_magnetization": ("total_magnetization", "maximize"),
        "is_magnetic": ("is_magnetic", "maximize"),
        "magnetization": ("total_magnetization", "maximize"),
        "magnetic": ("is_magnetic", "maximize"),
        
        # Surface properties
        "weighted_work_function": ("weighted_work_function", "maximize"),
        "weighted_surface_energy": ("weighted_surface_energy", "minimize"),
        "surface_anisotropy": ("surface_anisotropy", "minimize"),
        "work_function": ("weighted_work_function", "maximize"),
        "surface_energy": ("weighted_surface_energy", "minimize"),
        
        # Structural properties
        "volume": ("volume", "minimize"),
        "nsites": ("nsites", "minimize"),
        "nelements": ("nelements", "minimize"),
        "binary": ("nelements", "minimize"),
        "ternary": ("nelements", "minimize"),
        "quaternary": ("nelements", "minimize"),
        
        # Stability
        "is_stable": ("is_stable", "maximize"),
        "stability": ("energy_above_hull", "minimize"),
        "stable": ("is_stable", "maximize"),
        
        # Application-specific
        "aerospace": ("density", "minimize"),
        "catalyst": ("formation_energy_per_atom", "minimize"),
        "battery": ("formation_energy_per_atom", "minimize"),
        "solar": ("band_gap", "maximize"),
        "led": ("band_gap", "maximize"),
        "laser": ("band_gap", "maximize"),
        "transparent": ("band_gap", "maximize"),
        "opaque": ("band_gap", "minimize"),
        "conducting": ("is_metal", "maximize"),
        "insulating": ("band_gap", "maximize"),
        "semiconductor": ("band_gap", "maximize"),
        "insulator": ("band_gap", "maximize"),
        "piezoelectric": ("bulk_modulus", "maximize"),
        "ferroelectric": ("bulk_modulus", "maximize"),
        "superconductor": ("is_metal", "maximize"),
    }
    
    for obj in objectives:
        obj_lower = obj.lower().strip()
        prop, action = None, "minimize"
        
        # Direct property mapping
        if obj_lower in objective_mapping:
            prop, action = objective_mapping[obj_lower]
        else:
            # Fuzzy matching for complex objectives
            if "band" in obj_lower and "gap" in obj_lower:
                prop, action = "band_gap", "maximize"
            elif "formation" in obj_lower and "energy" in obj_lower:
                prop, action = "formation_energy_per_atom", "minimize"
            elif "stability" in obj_lower or "hull" in obj_lower:
                prop, action = "energy_above_hull", "minimize"
            elif "density" in obj_lower:
                prop, action = "density", "minimize"
            elif "bulk" in obj_lower and "modulus" in obj_lower:
                prop, action = "bulk_modulus", "maximize"
            elif "shear" in obj_lower and "modulus" in obj_lower:
                prop, action = "shear_modulus", "maximize"
            elif "magnetic" in obj_lower or "magnetization" in obj_lower:
                prop, action = "total_magnetization", "maximize"
            elif "work" in obj_lower and "function" in obj_lower:
                prop, action = "weighted_work_function", "maximize"
            elif "surface" in obj_lower and "energy" in obj_lower:
                prop, action = "weighted_surface_energy", "minimize"
            elif "anisotropy" in obj_lower:
                prop, action = "universal_anisotropy", "minimize"
            elif "direct" in obj_lower and "gap" in obj_lower:
                prop, action = "is_gap_direct", "maximize"
            elif "metal" in obj_lower:
                prop, action = "is_metal", "minimize"  # Usually want non-metals
            elif "stable" in obj_lower:
                prop, action = "is_stable", "maximize"

        if prop and prop in df.columns:
            prop_names.append(prop)
            actions.append(action)
            recognized.append(f"{obj} → {action} {prop}")
        else:
            # Log unmapped objectives
            await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": f"Could not map objective: '{obj}' to available properties"})

    # --- Fallback if nothing was mapped ---
    if not prop_names:
        fallback_props = ["band_gap", "formation_energy_per_atom"]
        existing_props = [p for p in fallback_props if p in df.columns]
        if not existing_props:
            await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No valid properties found for Pareto analysis."})
            return {"pareto_front_data": pd.DataFrame()}
        prop_names = existing_props
        actions = ["maximize" if p == "band_gap" else "minimize" for p in existing_props]
        recognized.append(f"Fallback objectives used: {existing_props}")
    
    await send_update(session_id, {"agent": "Hephaestus", "status": "info", "log": f"Objectives mapped: {recognized}"})
    
    # Drop NaNs in selected columns
    df = df.dropna(subset=prop_names)
    if df.empty:
        await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No valid materials found after cleaning."})
        return {"pareto_front_data": pd.DataFrame()}

    # Build objective matrix with safe array handling
    obj_values = []
    for prop, action in zip(prop_names, actions):
        try:
            values = df[prop].values.astype(float)
            # Handle NaN values safely
            if np.any(np.isnan(values)):
                median_val = np.nanmedian(values)
                if np.isnan(median_val):
                    median_val = 0.0
                values = np.nan_to_num(values, nan=median_val)
            
            # Ensure we have a proper array
            if not isinstance(values, np.ndarray):
                values = np.array(values)
            
            # Apply maximize/minimize transformation
            if action == "maximize":
                obj_values.append(-values)
            else:
                obj_values.append(values)
                
        except Exception as e:
            await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": f"Error processing {prop}: {e}"})
            continue
            
    if not obj_values:
        await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No valid objectives to optimize."})
        return {"pareto_front_data": pd.DataFrame()}
    
    # Safely stack objective values
    try:
        F = np.column_stack(obj_values)
        if F.ndim == 1:
            F = F.reshape(-1, 1)
    except Exception as e:
        await send_update(session_id, {"agent": "Hephaestus", "status": "error", "log": f"Error stacking objectives: {e}"})
        return {"pareto_front_data": pd.DataFrame()}

    # Filter out infinite/NaN rows safely
    try:
        finite_mask = np.isfinite(F).all(axis=1)
        F_finite = F[finite_mask]
        df_finite = df.iloc[finite_mask].reset_index(drop=True)
    except Exception as e:
        await send_update(session_id, {"agent": "Hephaestus", "status": "error", "log": f"Error filtering finite values: {e}"})
        return {"pareto_front_data": pd.DataFrame()}

    await send_update(session_id, {"agent": "Hephaestus", "status": "thinking", "log": f"Analyzing {len(F_finite)} materials with {F_finite.shape[1]} objectives."})

    # --- Robust Pareto front extraction with fallback ---
    n_points = len(F_finite)
    if n_points == 0:
        await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": "No finite materials to analyze."})
        return {"pareto_front_data": pd.DataFrame()}
    elif n_points == 1:
        pareto_df = df_finite.copy()
    else:
        try:
            # Advanced Pareto front calculation with crowding distance
            F_list = F_finite.tolist()
            is_dominated = [False] * n_points
            domination_count = [0] * n_points
            dominated_solutions = [[] for _ in range(n_points)]
            
            # Calculate domination relationships
            for i in range(n_points):
                for j in range(n_points):
                    if i == j:
                        continue
                        
                    current_point = F_list[i]
                    other_point = F_list[j]
                    
                    # Check if other_point dominates current_point
                    all_better_or_equal = True
                    any_strictly_better = False
                    
                    for k in range(len(current_point)):
                        current_val = float(current_point[k])
                        other_val = float(other_point[k])
                        
                        if other_val > current_val:  # other is worse
                            all_better_or_equal = False
                            break
                        elif other_val < current_val:  # other is better
                            any_strictly_better = True
                    
                    if all_better_or_equal and any_strictly_better:
                        domination_count[i] += 1
                        dominated_solutions[j].append(i)
            
            # Find Pareto front (non-dominated solutions)
            pareto_indices = [i for i in range(n_points) if domination_count[i] == 0]
            
            # If we have too many Pareto solutions, use crowding distance for selection
            if len(pareto_indices) > 10:
                # Calculate crowding distance for diversity
                crowding_distances = [0.0] * len(pareto_indices)
                
                for obj_idx in range(F_finite.shape[1]):
                    # Sort by this objective
                    sorted_indices = sorted(pareto_indices, key=lambda i: F_finite[i, obj_idx])
                    
                    # Boundary points get infinite distance
                    crowding_distances[pareto_indices.index(sorted_indices[0])] = float('inf')
                    crowding_distances[pareto_indices.index(sorted_indices[-1])] = float('inf')
                    
                    # Calculate distances for intermediate points
                    obj_range = F_finite[sorted_indices[-1], obj_idx] - F_finite[sorted_indices[0], obj_idx]
                    if obj_range > 0:
                        for i in range(1, len(sorted_indices) - 1):
                            idx = pareto_indices.index(sorted_indices[i])
                            distance = (F_finite[sorted_indices[i+1], obj_idx] - F_finite[sorted_indices[i-1], obj_idx]) / obj_range
                            crowding_distances[idx] += distance
                
                # Select top 10 solutions by crowding distance
                top_indices = sorted(range(len(pareto_indices)), 
                                   key=lambda i: crowding_distances[i], reverse=True)[:10]
                pareto_indices = [pareto_indices[i] for i in top_indices]
            
            pareto_df = df_finite.iloc[pareto_indices].copy()
            
        except Exception as pareto_error:
            await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": f"Pareto analysis failed: {pareto_error}. Using ranking-based selection."})
            
            # Fallback: Use simple ranking-based approach
            try:
                # Create a simple composite score
                composite_scores = []
                for i in range(n_points):
                    score = 0.0
                    for j, (prop, action) in enumerate(zip(prop_names, actions)):
                        if j < F_finite.shape[1]:
                            val = float(F_finite[i, j])
                            if action == "maximize":
                                score += val  # Higher is better
                            else:
                                score -= val  # Lower is better
                    composite_scores.append(score)
                
                # Select top 30% or at least top 3 materials
                n_select = max(3, min(n_points, n_points // 3))
                top_indices = sorted(range(len(composite_scores)), 
                                   key=lambda i: composite_scores[i], reverse=True)[:n_select]
                pareto_df = df_finite.iloc[top_indices].copy()
                
            except Exception as fallback_error:
                await send_update(session_id, {"agent": "Hephaestus", "status": "error", "log": f"Fallback also failed: {fallback_error}. Returning all materials."})
                pareto_df = df_finite.copy()

    # Log the Pareto front materials for debugging
    pareto_materials = []
    for _, row in pareto_df.iterrows():
        pareto_materials.append(row.get('formula_pretty', 'Unknown'))
    
    await send_update(session_id, {"agent": "Hephaestus", "status": "success", "log": f"Pareto Front identified with {len(pareto_df)} optimal materials: {pareto_materials}"})

    # Convert DataFrame → JSON-serializable with robust error handling
    pareto_records = []
    try:
        for _, row in pareto_df.iterrows():
            record = {}
            for col in pareto_df.columns:
                try:
                    val = row[col]
                    if pd.isna(val):
                        record[col] = None
                    elif isinstance(val, (np.integer, np.floating)):
                        record[col] = float(val)
                    elif isinstance(val, np.bool_):
                        record[col] = bool(val)
                    elif isinstance(val, np.ndarray):
                        if val.size == 1:
                            record[col] = float(val.item())
                        else:
                            record[col] = val.tolist()
                    else:
                        record[col] = str(val)
                except Exception as col_error:
                    record[col] = str(val) if val is not None else None
            pareto_records.append(record)
    except Exception as conversion_error:
        await send_update(session_id, {"agent": "Hephaestus", "status": "warning", "log": f"Error converting results: {conversion_error}"})
        # Create a simple fallback record
        pareto_records = [{"error": "Data conversion failed", "formula_pretty": "Unknown"}]
    
    await send_update(session_id, {"pareto_front": pareto_records})
    return {"pareto_front_data": pareto_df}


async def critic_agent_node(state: AgentState):
    session_id = state['session_id']
    await send_update(session_id, {"agent": "Cassandra", "status": "thinking", "log": "Assessing stability and feasibility..."})
    
    pareto_df = state.get('pareto_front_data')
    if pareto_df is None or pareto_df.empty:
        await send_update(session_id, {"agent": "Cassandra", "status": "warning", "log": "No Pareto front data to critique."})
        return {"pareto_front_data": pd.DataFrame()}

    try:
        await send_update(session_id, {"agent": "Cassandra", "status": "thinking", "log": "Calculating feasibility scores..."})
        
        if 'energy_above_hull' in pareto_df.columns:
            try:
                e_above_hull = pareto_df['energy_above_hull'].fillna(0)
                max_e_above_hull = float(e_above_hull.max())
                
                # Avoid division by zero
                if max_e_above_hull == 0:
                    pareto_df['Feasibility Score'] = 1.0
                else:
                    score = 1 - (e_above_hull / (max_e_above_hull + 1e-9))
                    pareto_df['Feasibility Score'] = score.round(3)
            except Exception as score_error:
                await send_update(session_id, {"agent": "Cassandra", "status": "warning", "log": f"Error calculating feasibility scores: {score_error}"})
                pareto_df['Feasibility Score'] = 0.5
        else:
            # Fallback scoring based on stability
            if 'is_stable' in pareto_df.columns:
                pareto_df['Feasibility Score'] = pareto_df['is_stable'].astype(float)
            else:
                pareto_df['Feasibility Score'] = 0.5
                
        await send_update(session_id, {"agent": "Cassandra", "status": "thinking", "log": "Feasibility scores calculated successfully"})
        
    except Exception as e:
        await send_update(session_id, {"agent": "Cassandra", "status": "error", "log": f"Error in feasibility calculation: {e}"})
        # Fallback to simple scoring
        pareto_df['Feasibility Score'] = 0.5
    
    await send_update(session_id, {"agent": "Cassandra", "status": "success", "log": "Feasibility scores assigned."})
    
    # Convert DataFrame to JSON-serializable format with robust error handling
    try:
        await send_update(session_id, {"agent": "Cassandra", "status": "thinking", "log": "Converting DataFrame to JSON format..."})
        pareto_records = []
        for _, row in pareto_df.iterrows():
            record = {}
            for col in pareto_df.columns:
                try:
                    value = row[col]
                    if pd.isna(value):
                        record[col] = None
                    elif isinstance(value, (np.integer, np.floating)):
                        record[col] = float(value)
                    elif isinstance(value, np.bool_):
                        record[col] = bool(value)
                    elif isinstance(value, np.ndarray):
                        if value.size == 1:
                            record[col] = float(value.item())
                        else:
                            record[col] = value.tolist()
                    else:
                        record[col] = str(value)
                except Exception as col_error:
                    # Fallback for problematic values
                    try:
                        record[col] = str(value) if value is not None else None
                    except:
                        record[col] = None
            pareto_records.append(record)
        
        await send_update(session_id, {"pareto_front": pareto_records})
        await send_update(session_id, {"agent": "Cassandra", "status": "success", "log": "JSON conversion completed successfully."})
    except Exception as e:
        await send_update(session_id, {"agent": "Cassandra", "status": "error", "log": f"Error in JSON conversion: {e}"})
        # Return empty records if conversion fails
        await send_update(session_id, {"pareto_front": []})
    
    return {"pareto_front_data": pareto_df}

# 4. Graph Definition
workflow = StateGraph(AgentState)

workflow.add_node("goal_analyst", goal_analyst_node)
workflow.add_node("strategy_agent", strategy_agent_node)
workflow.add_node("data_agent", data_agent_node)
workflow.add_node("pareto_analyzer", pareto_analysis_node)
workflow.add_node("critic", critic_agent_node)

workflow.set_entry_point("goal_analyst")
workflow.add_edge("goal_analyst", "strategy_agent")
workflow.add_edge("strategy_agent", "data_agent")
workflow.add_edge("data_agent", "pareto_analyzer")
workflow.add_edge("pareto_analyzer", "critic")
workflow.add_edge("critic", END)

app_graph = workflow.compile()

# --- API Endpoint ---
@app.post("/discover")
async def discover(request: Request):
    try:
        body = await request.json()
        user_goal = body.get("goal")
        property_constraints = body.get("constraints", {})  # <-- new field
        # Get API keys from request (user input) or fall back to environment variables
        openai_api_key = body.get("openaiApiKey") or os.getenv("OPENAI_API_KEY")
        mp_api_key = body.get("mpApiKey") or os.getenv("MP_API_KEY")
        google_api_key = body.get("googleApiKey") or os.getenv("GOOGLE_API_KEY")

        if not user_goal:
            raise HTTPException(status_code=400, detail="Missing goal parameter.")
        
        # Check if at least one LLM API key is available (from user input or .env file)
        if not any([openai_api_key, google_api_key]):
            raise HTTPException(
                status_code=400, 
                detail="At least one LLM API key required. Please provide openaiApiKey or googleApiKey in the request, or set OPENAI_API_KEY or GOOGLE_API_KEY in your .env file."
            )

        # Set environment variables for this request (prioritize user input)
        if body.get("openaiApiKey"): 
            os.environ["OPENAI_API_KEY"] = body.get("openaiApiKey")
        if body.get("googleApiKey"): 
            os.environ["GOOGLE_API_KEY"] = body.get("googleApiKey")
        if body.get("mpApiKey"): 
            os.environ["MP_API_KEY"] = body.get("mpApiKey")
        
        # Log which API keys are being used (without exposing the actual keys)
        api_sources = []
        if body.get("openaiApiKey"):
            api_sources.append("OpenAI (user provided)")
        elif os.getenv("OPENAI_API_KEY"):
            api_sources.append("OpenAI (.env file)")
            
        if body.get("googleApiKey"):
            api_sources.append("Google (user provided)")
        elif os.getenv("GOOGLE_API_KEY"):
            api_sources.append("Google (.env file)")
            
        if body.get("mpApiKey"):
            api_sources.append("Materials Project (user provided)")
        elif os.getenv("MP_API_KEY"):
            api_sources.append("Materials Project (.env file)")
        
        print(f"API Keys being used: {', '.join(api_sources)}")
        
        session_id = str(uuid4())
        
        async def event_stream():
            app.state.streams[session_id] = asyncio.Queue()
            try:
                asyncio.create_task(run_graph(session_id, user_goal, property_constraints))
                while True:
                    try:
                        message = await asyncio.wait_for(app.state.streams[session_id].get(), timeout=60.0)
                        if message is None:
                            break
                        yield {"data": message}
                    except asyncio.TimeoutError:
                        yield {"data": json.dumps({"keepalive": True})}
            finally:
                if session_id in app.state.streams:
                    del app.state.streams[session_id]

        return EventSourceResponse(event_stream())

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def run_graph(session_id: str, user_goal: str, property_constraints: dict = None):
    inputs = {
        "user_goal": user_goal, 
        "session_id": session_id,
        "formalized_objectives": None,
        "search_query": None,
        "raw_materials_data": None,
        "pareto_front_data": None,
        "final_report": None,
        "property_constraints": property_constraints or {}
    }
    
    try:
        await send_update(session_id, {"agent": "System", "status": "thinking", "log": "Starting materials discovery workflow..."})
        final_state = await app_graph.ainvoke(inputs)
        await send_update(session_id, {"agent": "System", "status": "thinking", "log": "Workflow execution completed, processing results..."})
        
        # Final report generation remains the same...
        pareto_df = final_state.get('pareto_front_data')
        best_candidate = {}
        if pareto_df is not None and not pareto_df.empty:
            await send_update(session_id, {"agent": "System", "status": "thinking", "log": f"Processing {len(pareto_df)} materials for final selection."})
            
            try:
                # Safely flatten arrays and ensure scalars
                for col in pareto_df.columns:
                    try:
                        pareto_df[col] = pareto_df[col].apply(
                            lambda v: v.item() if isinstance(v, np.ndarray) and v.size == 1 else (
                                v.tolist() if isinstance(v, np.ndarray) else v
                            )
                        )
                    except Exception as col_error:
                        # If column processing fails, convert to string
                        pareto_df[col] = pareto_df[col].astype(str)

                # Select best material safely with diversity
                if 'Feasibility Score' in pareto_df.columns:
                    try:
                        # Convert to float safely
                        feasibility_scores = []
                        for score in pareto_df['Feasibility Score']:
                            try:
                                feasibility_scores.append(float(score))
                            except:
                                feasibility_scores.append(0.0)
                        
                        # Log the available materials and scores for debugging
                        materials_info = []
                        for i, (idx, row) in enumerate(pareto_df.iterrows()):
                            materials_info.append(f"{row.get('formula_pretty', 'Unknown')}: {feasibility_scores[i]:.3f}")
                        
                        await send_update(session_id, {"agent": "System", "status": "info", "log": f"Available materials: {materials_info}"})
                        
                        # Advanced multi-criteria selection strategy
                        import random
                        if len(feasibility_scores) > 1:
                            # Multi-criteria decision making approach
                            # Consider both feasibility score and objective performance
                            
                            # Define objective mapping for selection
                            objective_mapping = {
                                "band_gap": ("band_gap", "maximize"),
                                "formation_energy_per_atom": ("formation_energy_per_atom", "minimize"),
                                "energy_above_hull": ("energy_above_hull", "minimize"),
                                "is_metal": ("is_metal", "minimize"),
                                "is_gap_direct": ("is_gap_direct", "maximize"),
                                "bulk_modulus": ("bulk_modulus", "maximize"),
                                "shear_modulus": ("shear_modulus", "maximize"),
                                "density": ("density", "minimize"),
                                "universal_anisotropy": ("universal_anisotropy", "minimize"),
                                "total_magnetization": ("total_magnetization", "maximize"),
                                "weighted_work_function": ("weighted_work_function", "maximize"),
                                "weighted_surface_energy": ("weighted_surface_energy", "minimize"),
                                "volume": ("volume", "minimize"),
                                "is_stable": ("is_stable", "maximize"),
                            }
                            
                            # Calculate composite scores
                            composite_scores = []
                            for i, (idx, row) in enumerate(pareto_df.iterrows()):
                                score = feasibility_scores[i]
                                
                                # Add bonus for good objective performance
                                objective_bonus = 0.0
                                # Get the objective properties and actions from the final state
                                objectives = final_state.get('formalized_objectives', {}).get('objectives', [])
                                for obj in objectives:
                                    obj_lower = obj.lower().strip()
                                    if obj_lower in objective_mapping:
                                        prop, action = objective_mapping[obj_lower]
                                        if prop in row and not pd.isna(row[prop]):
                                            val = float(row[prop])
                                            if action == "maximize":
                                                # Normalize and add bonus for high values
                                                max_val = pareto_df[prop].max()
                                                min_val = pareto_df[prop].min()
                                                if max_val > min_val:
                                                    normalized = (val - min_val) / (max_val - min_val)
                                                    objective_bonus += normalized * 0.2
                                            else:  # minimize
                                                # Normalize and add bonus for low values
                                                max_val = pareto_df[prop].max()
                                                min_val = pareto_df[prop].min()
                                                if max_val > min_val:
                                                    normalized = 1 - (val - min_val) / (max_val - min_val)
                                                    objective_bonus += normalized * 0.2
                                
                                # Add stability bonus
                                stability_bonus = 0.0
                                if 'is_stable' in row and row['is_stable']:
                                    stability_bonus = 0.1
                                if 'energy_above_hull' in row and not pd.isna(row['energy_above_hull']):
                                    hull_energy = float(row['energy_above_hull'])
                                    if hull_energy < 0.1:  # Very stable
                                        stability_bonus += 0.1
                                
                                composite_score = score + objective_bonus + stability_bonus
                                composite_scores.append(composite_score)
                            
                            # Use weighted selection based on composite scores
                            max_score = max(composite_scores)
                            min_score = min(composite_scores)
                            if max_score > min_score:
                                # Weight by composite score with some randomness
                                weights = [(score - min_score + 0.1) ** 2 for score in composite_scores]  # Square for more emphasis on good scores
                                total_weight = sum(weights)
                                probabilities = [w / total_weight for w in weights]
                                
                                # Select with weighted probability
                                best_idx = random.choices(range(len(composite_scores)), weights=probabilities)[0]
                            else:
                                # All scores are equal, pick randomly
                                best_idx = random.randint(0, len(composite_scores) - 1)
                        else:
                            best_idx = 0
                        
                        best_material = pareto_df.iloc[best_idx].to_dict()
                        await send_update(session_id, {"agent": "System", "status": "info", "log": f"Selected material: {best_material.get('formula_pretty', 'Unknown')} (index {best_idx})"})
                        
                    except Exception as score_error:
                        # Fallback to first material
                        best_material = pareto_df.iloc[0].to_dict()
                        await send_update(session_id, {"agent": "System", "status": "warning", "log": f"Score selection failed: {score_error}, using first material"})
                else:
                    best_material = pareto_df.iloc[0].to_dict()
                    await send_update(session_id, {"agent": "System", "status": "info", "log": "No feasibility scores, using first material"})

                # Convert properties safely
                properties = {}
                for key, value in best_material.items():
                    try:
                        if pd.isna(value):
                            properties[key] = None
                        elif isinstance(value, (np.integer, np.floating)):
                            properties[key] = float(value)
                        elif isinstance(value, np.bool_):
                            properties[key] = bool(value)
                        elif isinstance(value, np.ndarray):
                            properties[key] = value.item() if value.size == 1 else value.tolist()
                        else:
                            properties[key] = str(value)
                    except Exception as prop_error:
                        # Fallback to string conversion
                        properties[key] = str(value) if value is not None else None
                
                best_candidate = {
                    "formula": str(best_material.get("formula_pretty", "Unknown")),
                    "properties": properties,
                    "material_id": str(best_material.get("material_id", "Unknown"))
                }
                
                await send_update(session_id, {"agent": "System", "status": "success", "log": "Best candidate selected successfully."})
            except Exception as e:
                await send_update(session_id, {"agent": "System", "status": "error", "log": f"Error in candidate selection: {e}"})
                best_candidate = {"formula": "Unknown", "properties": {"error": "Failed to process material data"}, "material_id": "unknown"}
        else:
            await send_update(session_id, {"agent": "System", "status": "warning", "log": "No materials found in Pareto front."})
            best_candidate = {"formula": "No materials found", "properties": {"note": "No viable materials found with current constraints"}, "material_id": "none"}
        
        await send_update(session_id, {"final_candidate": best_candidate, "log": "Materials discovery campaign complete!"})
        
    except Exception as e:
        await send_update(session_id, {"agent": "System", "status": "error", "log": f"Workflow error: {str(e)}"})
        error_candidate = {"formula": "Error", "properties": {"error": str(e)}, "material_id": "error"}
        await send_update(session_id, {"final_candidate": error_candidate, "log": "Campaign completed with errors."})

    finally:
        if session_id in app.state.streams:
            try:
                await app.state.streams[session_id].put(None)
            except:
                pass


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "mp_api_available": MP_API_AVAILABLE,
        "google_api_configured": bool(os.getenv("GOOGLE_API_KEY")),
        "openai_api_configured": bool(os.getenv("OPENAI_API_KEY")),
        "mp_api_configured": bool(os.getenv("MP_API_KEY")),
        "api_key_sources": {
            "google": "environment" if os.getenv("GOOGLE_API_KEY") else "not configured",
            "openai": "environment" if os.getenv("OPENAI_API_KEY") else "not configured", 
            "materials_project": "environment" if os.getenv("MP_API_KEY") else "not configured"
        }
    }

# API configuration endpoint
@app.get("/api-config")
async def api_config():
    """Show which API keys are configured from environment variables"""
    return {
        "message": "API configuration status",
        "environment_variables": {
            "GOOGLE_API_KEY": "configured" if os.getenv("GOOGLE_API_KEY") else "not set",
            "OPENAI_API_KEY": "configured" if os.getenv("OPENAI_API_KEY") else "not set",
            "MP_API_KEY": "configured" if os.getenv("MP_API_KEY") else "not set"
        },
        "instructions": {
            "setup": "Create a .env file in the backend directory with your API keys",
            "example": {
                "GOOGLE_API_KEY": "your_google_gemini_api_key_here",
                "OPENAI_API_KEY": "your_openai_api_key_here", 
                "MP_API_KEY": "your_materials_project_api_key_here"
            },
            "note": "User-provided API keys in requests will override environment variables"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)