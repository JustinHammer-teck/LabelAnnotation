# GPU Setup Guide for Label Studio OCR

## Overview

Label Studio now supports GPU acceleration for EasyOCR Chinese character recognition, providing **10x faster** OCR processing compared to CPU mode.

**Performance Comparison:**

| Mode | Processing Time (per page) | Throughput |
|------|---------------------------|------------|
| CPU | 3-5 seconds | ~12-20 pages/min |
| GPU (CUDA) | 0.3-0.5 seconds | ~120-200 pages/min |
| **Speedup** | **10x faster** | **10x higher** |

## Prerequisites

### Hardware Requirements
- NVIDIA GPU with CUDA capability ≥ 3.5
- Minimum 4GB VRAM (8GB+ recommended for batch processing)

### Software Requirements
- NVIDIA GPU drivers ≥ 525.60.13 (for CUDA 12)
- NVIDIA Container Toolkit (nvidia-docker2)
- Docker Engine ≥ 19.03

## Host System Setup

### 1. Verify NVIDIA GPU

```bash
# Check GPU is detected
nvidia-smi

# Expected output should show your GPU model and driver version
```

### 2. Install NVIDIA Container Toolkit

**Ubuntu/Debian:**

```bash
# Add NVIDIA repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
    sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Install toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Restart Docker
sudo systemctl restart docker
```

**RHEL/CentOS:**

```bash
# Add repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | \
    sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo

# Install toolkit
sudo yum install -y nvidia-container-toolkit

# Restart Docker
sudo systemctl restart docker
```

### 3. Verify Docker GPU Access

```bash
# Test GPU access in Docker
docker run --rm --gpus all nvidia/cuda:12.6.0-base-ubuntu22.04 nvidia-smi

# Expected: Should show nvidia-smi output from inside container
```

If this works, your system is ready for GPU-accelerated OCR!

## Label Studio Configuration

### Development Mode

**Start with GPU acceleration:**

```bash
docker-compose -f docker-compose.dev.yml -f docker-compose.gpu.yml up
```

**Start without GPU (CPU mode):**

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Mode

**Start with GPU acceleration:**

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.gpu.yml up -d
```

**Start without GPU (CPU mode):**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Configuration Options

### Environment Variables

Edit `.env.list` or `.env.development`:

```bash
# Enable/disable GPU (overridden by docker-compose.gpu.yml)
OCR_USE_GPU=0              # 0=CPU, 1=GPU

# Batch size for OCR processing
# Higher values = faster processing but more VRAM usage
OCR_BATCH_SIZE=1           # CPU: 1, GPU: 4-8 recommended

# Enable Chinese character preprocessing
OCR_PREPROCESS_CHINESE=1   # 1=enabled (recommended)

# Disable image binarization (better for Chinese)
OCR_BINARIZE=0             # 0=disabled (recommended for Chinese)

# Enable/disable OCR entirely
OCR_ENABLED=1              # 1=enabled
```

### GPU-Specific Tuning

For optimal GPU performance, adjust batch size based on your GPU VRAM:

| GPU VRAM | Recommended Batch Size |
|----------|------------------------|
| 4GB | 2-4 |
| 8GB | 4-8 |
| 12GB+ | 8-16 |

Edit `docker-compose.gpu.yml` to customize:

```yaml
services:
  worker-high:
    environment:
      - OCR_USE_GPU=true
      - OCR_BATCH_SIZE=16  # Adjust based on your GPU
```

## Verification

### 1. Check GPU is Accessible

```bash
# Check from app container
docker-compose exec app python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU count: {torch.cuda.device_count()}')"

# Expected output:
# CUDA available: True
# GPU count: 1
```

### 2. Verify EasyOCR GPU Mode

```bash
# Test EasyOCR initialization
docker-compose exec app python << 'EOF'
from label_studio.data_import.services import get_easyocr_reader
reader = get_easyocr_reader()
print(f"Reader GPU mode: {reader.gpu if hasattr(reader, 'gpu') else 'Unknown'}")
EOF

# Expected output: Reader GPU mode: True
```

### 3. Monitor GPU Usage

While OCR is processing:

```bash
# Real-time GPU monitoring
watch -n 1 nvidia-smi

# Container-specific stats
docker stats $(docker ps -q --filter name=worker)
```

## Troubleshooting

### GPU Not Detected in Container

**Symptom:** `torch.cuda.is_available()` returns `False`

**Solutions:**

1. Verify NVIDIA Container Toolkit is installed:
   ```bash
   nvidia-ctk --version
   ```

2. Check Docker daemon configuration has nvidia runtime:
   ```bash
   docker info | grep -i runtime
   ```
   Should include: `Runtimes: nvidia runc`

3. Ensure you're using `docker-compose.gpu.yml`:
   ```bash
   docker-compose -f docker-compose.dev.yml -f docker-compose.gpu.yml up
   ```

### CUDA Out of Memory

**Symptom:** Error message about CUDA OOM (out of memory)

**Solutions:**

1. Reduce batch size in `.env.list`:
   ```bash
   OCR_BATCH_SIZE=1  # Lower value
   ```

2. Reduce number of worker processes processing OCR simultaneously

3. Check GPU memory usage:
   ```bash
   nvidia-smi
   ```

### Slow Performance with GPU

**Symptom:** GPU mode not significantly faster than CPU

**Possible causes:**

1. Batch size too low - increase `OCR_BATCH_SIZE` to 4-8
2. Small images - GPU overhead not worth it for tiny images
3. GPU shared with other processes - check `nvidia-smi` for other processes

### Driver Compatibility Issues

**Symptom:** CUDA version mismatch errors

**Solution:**

Check driver supports CUDA 12.6:

```bash
nvidia-smi | grep "CUDA Version"
```

If CUDA version is lower than 12.0, update NVIDIA drivers:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install --upgrade nvidia-driver-535

# Reboot required
sudo reboot
```

## Performance Best Practices

### 1. Worker Configuration

For GPU acceleration, dedicate specific workers to OCR tasks:

- `worker-high`: OCR-intensive tasks with GPU
- `worker-critical`: High-priority OCR with GPU
- `worker-default`: General tasks, CPU is fine

### 2. Multiple GPUs

If you have multiple GPUs, you can assign different workers to different GPUs:

Edit `docker-compose.gpu.yml`:

```yaml
services:
  worker-high:
    environment:
      - CUDA_VISIBLE_DEVICES=0  # Use GPU 0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']
              capabilities: [gpu]

  worker-critical:
    environment:
      - CUDA_VISIBLE_DEVICES=1  # Use GPU 1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['1']
              capabilities: [gpu]
```

### 3. CPU Fallback

The application automatically falls back to CPU if:
- GPU is not available
- CUDA initialization fails
- `OCR_USE_GPU=0` in environment

This ensures backward compatibility and works on non-GPU hosts.

## Cost Considerations

### Cloud Deployments

GPU instances are more expensive than CPU instances. Consider:

- **AWS**: p3.2xlarge (1x V100) ~$3/hour vs t3.large (CPU) ~$0.08/hour
- **GCP**: n1-standard-4 with 1x T4 ~$0.95/hour vs n1-standard-4 (CPU) ~$0.19/hour
- **Azure**: NC6 (1x K80) ~$0.90/hour vs D2s_v3 (CPU) ~$0.10/hour

**ROI Calculation:**

If processing >100 pages/hour, GPU typically pays for itself through:
- Faster processing = less time = lower costs
- Better user experience
- Higher throughput capacity

For <50 pages/hour, CPU mode is more cost-effective.

## Summary

**To enable GPU acceleration:**

1. Install NVIDIA Container Toolkit on host
2. Use `docker-compose.gpu.yml` overlay when starting containers
3. Verify GPU access with `nvidia-smi` inside container
4. Monitor performance and adjust batch size

**Expected result:** 10x faster OCR processing for Chinese characters.
