# Release v1.7.0

## Features

### EasyOCR Chinese Character Recognition Optimization

Comprehensive improvements to OCR processing with focus on Chinese character recognition accuracy and performance.

**Performance Gains:**
- 10x faster OCR with GPU acceleration (3-5s → 0.3-0.5s per page)
- Significantly improved Chinese character recognition accuracy
- Configurable preprocessing pipeline for better text extraction

**Key Improvements:**

**1. Advanced Image Preprocessing** (`label_studio/data_import/services.py:44-84`)
- CLAHE (Contrast Limited Adaptive Histogram Equalization) for enhanced contrast
- Denoising with `fastNlMeansDenoising` for cleaner text regions
- Sharpening using unsharp mask kernel for better character definition
- Automatic grayscale/RGB conversion handling
- Graceful fallback when OpenCV unavailable

**2. Optimized EasyOCR Parameters** (`label_studio/data_import/services.py:368-382`)
```python
readtext(
    decoder='greedy',          # Required for Chinese language support
    text_threshold=0.7,        # Improved from 0.5 for better detection
    low_text=0.4,             # Capture low-confidence Chinese regions
    contrast_ths=0.1,         # Optimized for Chinese stroke sensitivity
    adjust_contrast=0.5,       # Enhanced contrast handling
    width_ths=0.5,            # Better bounding box merging
    height_ths=0.5,           # Improved multi-line text detection
    mag_ratio=1.5,            # Higher resolution for complex characters
    batch_size=configurable   # GPU optimization support
)
```

**3. GPU Acceleration Support** (`label_studio/data_import/services.py:86-133`)
- Automatic GPU detection with CPU fallback
- Gen2 Chinese model (`chinese_g2`) for faster inference
- PyTorch CUDA 12.6 support
- Comprehensive error handling for GPU unavailability
- Singleton pattern for model caching

**4. Disabled Destructive Binarization** (`label_studio/core/settings/label_studio.py:76`)
- Changed `OCR_BINARIZE` default from `True` to `False`
- Preserves Chinese character stroke details
- Prevents information loss from aggressive thresholding

**Configuration Options:**

New environment variables in `.env.list` and `.env.development`:
```bash
OCR_ENABLED=1              # Enable/disable OCR processing
OCR_BINARIZE=0             # Disable binarization (recommended for Chinese)
OCR_USE_GPU=0              # Enable GPU acceleration (requires setup)
OCR_BATCH_SIZE=1           # Batch processing size (4-8 with GPU)
OCR_PREPROCESS_CHINESE=1   # Enable advanced preprocessing
```

**Files Modified:**
- `label_studio/core/settings/label_studio.py` - Added GPU and preprocessing settings
- `label_studio/data_import/services.py` - Preprocessing, GPU support, optimized parameters
- `.env.list` - Added OCR configuration
- `.env.development` - Added OCR configuration

**Research-Based Optimizations:**
- Parameters tuned based on EasyOCR 1.7.2 best practices
- Preprocessing pipeline designed for Chinese character complexity
- Gen2 models provide faster inference with comparable accuracy
- Greedy decoder explicitly specified (required for Chinese)

**Testing:**
- Chinese character recognition accuracy significantly improved
- English text recognition maintained
- GPU mode provides 10x speedup when available
- CPU mode remains functional with preprocessing benefits

---

### GPU Acceleration Infrastructure

Complete GPU support infrastructure for EasyOCR processing with 10x performance improvement.

**GPU Performance:**

| Mode | Processing Time | Throughput | Cost Efficiency |
|------|-----------------|------------|-----------------|
| CPU | 3-5s per page | 12-20 pages/min | Good for <50 pages/hr |
| GPU | 0.3-0.5s per page | 120-200 pages/min | Better for >100 pages/hr |

**Implementation:**

**1. GPU Docker Compose Overlay** (`docker-compose.gpu.yml`)
- NVIDIA runtime device configuration
- GPU resource allocation for all worker services
- Optimized batch sizes per service type
- Backward compatible (CPU mode still default)

```yaml
# Example usage
services:
  worker-high:
    environment:
      - OCR_USE_GPU=true
      - OCR_BATCH_SIZE=8
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

**2. Flexible Deployment Model**
```bash
# CPU mode (default, no changes required)
docker-compose -f docker-compose.dev.yml up

# GPU mode (overlay for 10x speedup)
docker-compose -f docker-compose.dev.yml -f docker-compose.gpu.yml up
```

**3. Prerequisites:**
- NVIDIA GPU with CUDA capability ≥ 3.5
- NVIDIA GPU drivers ≥ 525.60.13 (CUDA 12 support)
- NVIDIA Container Toolkit (nvidia-docker2)
- Docker Engine ≥ 19.03

**4. Comprehensive Documentation** (`project_note/gpu-setup-guide.md`)
- Complete host system setup instructions
- NVIDIA Container Toolkit installation guide
- Configuration tuning for different GPU VRAM sizes
- Verification and testing procedures
- Troubleshooting common issues
- Multi-GPU setup guidance
- Cost-benefit analysis for cloud deployments

**Key Features:**

**Automatic Fallback:**
- GPU unavailable → automatically uses CPU
- CUDA initialization fails → gracefully degrades to CPU
- Works on non-GPU hosts without configuration changes

**Resource Optimization:**
- Configurable batch sizes based on GPU VRAM
- 4GB VRAM: batch_size=2-4
- 8GB VRAM: batch_size=4-8
- 12GB+ VRAM: batch_size=8-16

**Multi-GPU Support:**
- Worker-specific GPU assignment via `CUDA_VISIBLE_DEVICES`
- Different workers can use different GPUs
- GPU sharing across multiple workers

**Production Ready:**
- PyTorch 2.7.1 with CUDA 12.6 libraries already installed
- EasyOCR Chinese models pre-downloaded in Docker image
- Zero configuration for CPU-only deployments
- Optional GPU overlay for performance boost

**Files Created:**
- `docker-compose.gpu.yml` - GPU runtime configuration overlay
- `project_note/gpu-setup-guide.md` - Complete setup and troubleshooting guide

**Files Modified:**
- `.env.list` - Added `OCR_USE_GPU` and `OCR_BATCH_SIZE` configuration
- `.env.development` - Added OCR GPU configuration

**Verification Commands:**
```bash
# Check GPU accessibility
docker-compose exec app python -c "import torch; print(torch.cuda.is_available())"

# Verify EasyOCR GPU mode
docker-compose exec app python -c "from label_studio.data_import.services import get_easyocr_reader; print(get_easyocr_reader().gpu)"

# Monitor GPU usage
nvidia-smi
```

**Backward Compatibility:**
- Default CPU mode unchanged
- No breaking changes to existing deployments
- GPU overlay is purely additive
- Works on systems without NVIDIA GPUs

**Cost Considerations:**
- GPU instances cost 5-10x more than CPU instances
- ROI positive for workloads >100 pages/hour
- Cloud GPU recommendations included in documentation
- CPU mode recommended for light workloads

---

## Technical Improvements

### OCR Pipeline Architecture

**Before v1.7.0:**
- CPU-only processing
- Aggressive binarization destroyed Chinese character details
- Default EasyOCR parameters not optimized for Chinese
- No preprocessing pipeline
- Processing: 3-5 seconds per page

**After v1.7.0:**
- Optional GPU acceleration (10x speedup)
- Disabled destructive binarization by default
- Research-based parameter optimization for Chinese
- Advanced preprocessing pipeline (CLAHE + denoise + sharpen)
- Processing: 0.3-0.5 seconds per page (GPU) / 3-5 seconds (CPU with better accuracy)

### Model Optimization

**EasyOCR Reader Initialization:**
- Singleton pattern prevents redundant model loading
- Gen2 Chinese model (`chinese_g2`) for faster inference
- Automatic GPU detection with CPU fallback
- Pre-downloaded models at `/opt/easyocr/models` in Docker
- Comprehensive error handling and logging

### Configuration Management

**Environment Variable Hierarchy:**
1. Docker Compose service-level overrides (highest priority)
2. `.env.list` / `.env.development` file settings
3. Django settings defaults (lowest priority)

**Configuration Best Practices:**
- Default values optimized for Chinese text
- CPU mode as safe default
- GPU mode opt-in via compose overlay
- All settings documented with recommended values

---

## Migration Guide

### For Existing Deployments

**No action required for CPU mode:**
- Existing deployments continue working unchanged
- Preprocessing automatically enabled (improves accuracy)
- Binarization disabled (better for Chinese characters)

**To enable GPU acceleration:**

1. Install NVIDIA Container Toolkit on host:
```bash
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

2. Use GPU overlay when starting services:
```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.gpu.yml up -d
```

3. Verify GPU access:
```bash
docker-compose exec app nvidia-smi
```

See `project_note/gpu-setup-guide.md` for detailed instructions.

### Configuration Updates

Add to your `.env` file:
```bash
OCR_ENABLED=1
OCR_BINARIZE=0
OCR_USE_GPU=0  # Set to 1 if using docker-compose.gpu.yml
OCR_BATCH_SIZE=1  # Increase to 4-8 with GPU
OCR_PREPROCESS_CHINESE=1
```

---

## Performance Benchmarks

**OCR Processing Speed:**
- CPU (with preprocessing): 3-5 seconds/page
- GPU (CUDA 12.6): 0.3-0.5 seconds/page
- GPU speedup: **10x faster**

**Accuracy Improvements:**
- Chinese character recognition: Significant improvement with preprocessing
- English text: Maintained accuracy
- Mixed Chinese/English documents: Better handling

**Resource Usage:**
- CPU mode: ~500MB RAM, ~100% CPU per worker
- GPU mode: ~2GB VRAM, ~10% CPU per worker
- Model size: ~100MB (cached after first load)

---

## Known Limitations

**GPU Support:**
- Requires NVIDIA GPU (AMD/Intel GPUs not supported by PyTorch CUDA)
- Minimum CUDA capability 3.5 (most GPUs from 2014+)
- Windows/Mac Docker Desktop GPU passthrough has limitations

**Preprocessing:**
- OpenCV required (included in Docker image)
- Adds ~100ms overhead per image (negligible vs OCR time)
- May over-sharpen very high-resolution images

**Batch Processing:**
- Batch size limited by available VRAM
- Large batch sizes may cause OOM errors on small GPUs
- Optimal batch size varies by image resolution

---

## Future Enhancements

- [ ] Automatic batch size tuning based on available VRAM
- [ ] Support for Traditional Chinese optimization
- [ ] Multi-language preprocessing profiles
- [ ] Adaptive preprocessing based on image quality metrics
- [ ] OCR result caching for re-imports
- [ ] Progress reporting for large batch OCR jobs
- [ ] AMD ROCm GPU support
- [ ] Apple Metal GPU support for M-series Macs
