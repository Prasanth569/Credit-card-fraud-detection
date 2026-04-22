# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
FROM python:3.11-slim

# Create user to avoid permission issues in Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy the requirements file and install dependencies
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the entire ml-service code into the container
COPY --chown=user . /app

# Hugging Face requires the app to listen on port 7860
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "7860"]
