#!/bin/bash

# Deploy to AWS EC2
# Make sure to run this script with the necessary AWS credentials

# Variables
EC2_INSTANCE="your-ec2-instance-id"
REGION="us-east-1"
SSH_KEY="path/to/your-key.pem"
REMOTE_DIR="/home/ec2-user/aios-backend"

# Build the application
echo "Building application..."
npm run build

# Create deployment package
echo "Creating deployment package..."
tar -czf deploy.tar.gz dist package.json package-lock.json .env.example Dockerfile docker-compose.yml

# Copy files to EC2
echo "Copying files to EC2..."
scp -i $SSH_KEY deploy.tar.gz ec2-user@$EC2_INSTANCE:~

# SSH into EC2 and deploy
echo "Deploying on EC2..."
ssh -i $SSH_KEY ec2-user@$EC2_INSTANCE << 'EOF'
  mkdir -p $REMOTE_DIR
  tar -xzf deploy.tar.gz -C $REMOTE_DIR
  cd $REMOTE_DIR
  
  # Load environment variables
  if [ -f .env ]; then
    source .env
  fi
  
  # Start or restart Docker containers
  docker-compose down
  docker-compose up -d --build
  
  # Clean up
  rm ~/deploy.tar.gz
EOF

echo "Deployment completed!" 