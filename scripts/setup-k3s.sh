#!/bin/bash

# ecommerce-platform K3s Setup Script
set -e

echo "🚀 Starting K3s Setup for Personal Server..."

# 1. Install K3s (Lightweight Kubernetes)
if ! command -v k3s &> /dev/null; then
    echo "📦 Installing K3s..."
    curl -sfL https://get.k3s.io | sh -
else
    echo "✅ K3s is already installed."
fi

# 2. Setup Kubeconfig for current user
mkdir -p $HOME/.kube
sudo cp /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
echo "export KUBECONFIG=$HOME/.kube/config" >> $HOME/.bashrc

# 3. Verify node health
echo "⏳ Waiting for node to be Ready..."
until kubectl get nodes | grep -q "Ready"; do
  sleep 2
done
kubectl get nodes

# 4. Install local registry (Optional but recommended for dev)
# docker run -d -p 5000:5000 --restart=always --name registry registry:2

echo "🎉 K3s setup complete! You can now apply the manifests."
echo "Commands to run:"
echo "  kubectl apply -f k8s/namespace.yaml"
echo "  kubectl apply -f k8s/infrastructure/"
echo "  kubectl apply -f k8s/apps/"
echo "  kubectl apply -f k8s/ingress/"
