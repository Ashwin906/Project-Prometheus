# Project Prometheus Backend

A multi-agent materials discovery system using AI agents to find optimal materials based on user-defined objectives.

## Features

- **Multi-Agent Architecture**: Uses specialized AI agents (Epimetheus, Athena, Hermes, Hephaestus, Cassandra) for different tasks
- **Dual LLM Support**: Supports both OpenAI GPT and Google Gemini models
- **Materials Project Integration**: Accesses the Materials Project database for real materials data
- **Pareto Optimization**: Finds optimal trade-offs between multiple material properties
- **Real-time Updates**: Uses Server-Sent Events (SSE) for live progress updates

## Setup

### 1. Environment Configuration

Run the setup script to create your environment file:

```bash
python setup_env.py
```

This will create a `.env` file with template values. Edit the file and add your actual API keys:

```env
# OpenAI API Key (for GPT models)
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Key (for Gemini models)
GOOGLE_API_KEY=your_google_api_key_here

# Materials Project API Key
MP_API_KEY=your_materials_project_api_key_here

# Model Selection (openai or gemini)
DEFAULT_MODEL_PROVIDER=gemini
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Keys Required

### Materials Project API Key (Required)
- Get your free API key at: https://materialsproject.org/api
- This is required for accessing materials data

### LLM API Keys (At least one required)

#### Google Gemini (Recommended)
- Get your API key at: https://makersuite.google.com/app/apikey
- Uses Gemini 2.5 Pro model by default

#### OpenAI (Alternative)
- Get your API key at: https://platform.openai.com/api-keys
- Uses GPT-4o-mini model

## API Endpoints

### POST /discover

Start a materials discovery campaign.

**Request Body:**
```json
{
  "goal": "Find materials with high band gap and low formation energy",
  "openaiApiKey": "optional_openai_key",
  "googleApiKey": "optional_google_key", 
  "mpApiKey": "required_materials_project_key"
}
```

**Response:** Server-Sent Events stream with real-time updates

## Agent Roles

- **Epimetheus**: Goal analysis and objective formalization
- **Athena**: Strategy formulation and query planning
- **Hermes**: Data acquisition from Materials Project
- **Hephaestus**: Pareto front analysis and optimization
- **Cassandra**: Feasibility assessment and critique

## Model Selection

The system supports both OpenAI and Google Gemini models. You can:

1. Set `DEFAULT_MODEL_PROVIDER=gemini` in your `.env` file to use Gemini by default
2. Set `DEFAULT_MODEL_PROVIDER=openai` to use OpenAI by default
3. Provide API keys in the request to override the default

## Development

The code is structured to easily switch between LLM providers. OpenAI code is commented but preserved for future use.

## Screenshots

Below are some UI screenshots from the application. These are stored in the repository under `assets/`.

![Landing Page](../assets/Screenshot%202025-09-15%20134335.png)

![Workflow and Logs](../assets/Screenshot%202025-09-15%20134347.png)

![Pareto Front Visualization](../assets/Screenshot%202025-09-15%20134403.png)

![Configuration Sidebar](../assets/Screenshot%202025-09-15%20134441.png)

![Contact Page](../assets/Screenshot%202025-09-15%20134518.png)

