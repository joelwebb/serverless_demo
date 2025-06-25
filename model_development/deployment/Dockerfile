
FROM public.ecr.aws/lambda/python:3.10

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Install system dependencies
RUN yum update -y && \
    yum install -y gcc python3-devel && \
    yum clean all

# Install Python packages
RUN pip3 install --no-cache-dir \
    boto3==1.34.0 \
    pandas==2.0.3 \
    numpy==1.24.3 \
    scikit-learn==1.3.0 \
    transformers==4.30.0 \
    torch==2.0.1 \
    slack-sdk==3.22.0 \
    requests==2.31.0

# Copy application code
COPY lambda/ ${LAMBDA_TASK_ROOT}/
COPY models/ ${LAMBDA_TASK_ROOT}/models/
COPY utils/ ${LAMBDA_TASK_ROOT}/utils/

# Set permissions
RUN chmod 755 ${LAMBDA_TASK_ROOT}/lambda_handler.py

# Set the CMD to your handler
CMD ["lambda_handler.handler"]
