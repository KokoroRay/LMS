// Video Upload Service - Handles S3 upload and transcode APIs
import api from './authService';

// 🎯 Generate pre-signed upload URL for video
export const generateUploadUrl = async (fileName, contentType, courseId, lessonId, expirationHours = 2) => {
  try {
    // Generating upload URL
    
    const res = await api.post('/video/upload/upload-url', null, {
      params: {
        fileName,
        contentType,
        courseId,
        lessonId,
        expirationHours
      }
    });
    
    const result = res.data;
    console.log('✅ Upload URL generated:', result);
    
    return {
      uploadUrl: result.uploadUrl,
      videoKey: result.videoKey,
      courseId: result.courseId,
      lessonId: result.lessonId,
      expirationHours: result.expirationHours
    };
  } catch (error) {
    console.error('❌ Error generating upload URL:', error);
    throw error;
  }
};

// 🗑️ Delete video from S3
export const deleteVideo = async (videoKey) => {
  try {
    console.log('🗑️ Deleting video:', videoKey);
    
    const res = await api.delete(`/video/upload/${videoKey}`);
    const result = res.data;
    
    console.log('✅ Video deleted:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    throw error;
  }
};

// 🪣 Get S3 bucket information  
export const getBucketInfo = async () => {
  try {
    console.log('🪣 Getting bucket info...');
    
    const res = await api.get('/video/upload/bucket-info');
    const result = res.data;
    
    console.log('📊 Bucket info:', result);
    return {
      sourceBucket: result.sourceBucket,
      outputBucket: result.outputBucket,
      uploadFolder: result.uploadFolder,
      vodFolder: result.vodFolder,
      architecture: result.architecture,
      description: result.description
    };
  } catch (error) {
    console.error('❌ Error getting bucket info:', error);
    throw error;
  }
};

// 🔄 Check video transcode status
export const getTranscodeStatus = async (courseId, lessonId) => {
  try {
    console.log('🔄 Checking transcode status:', { courseId, lessonId });
    
    const res = await api.get(`/video/upload/transcode-status/${courseId}/${lessonId}`);
    const result = res.data;
    
    console.log('📊 Transcode status:', result);
    return {
      courseId: result.courseId,
      lessonId: result.lessonId,
      isTranscoded: result.isTranscoded,
      status: result.status
    };
  } catch (error) {
    console.error('❌ Error checking transcode status:', error);
    throw error;
  }
};

// 📤 Upload video file to S3 using pre-signed URL
export const uploadVideoToS3 = async (file, uploadUrl, onProgress) => {
  try {
    console.log('📤 Uploading video to S3:', file.name);
    
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          onProgress(percentage);
        }
      });
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Video uploaded successfully');
          resolve({ success: true, status: xhr.status });
        } else {
          console.error('❌ Upload failed:', xhr.status, xhr.statusText);
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        console.error('❌ Upload error:', xhr.statusText);
        reject(new Error('Upload failed'));
      };
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('❌ Error uploading video:', error);
    throw error;
  }
};

// 🎬 Complete video upload workflow
export const uploadVideoWorkflow = async (file, courseId, lessonId, onProgress) => {
  try {
    console.log('🎬 Starting video upload workflow...');
    
    // Step 1: Generate upload URL
    const uploadInfo = await generateUploadUrl(
      file.name,
      file.type,
      courseId,
      lessonId
    );
    
    // Step 2: Upload to S3
    await uploadVideoToS3(file, uploadInfo.uploadUrl, onProgress);
    
    // Step 3: Return video key for further processing
    return {
      success: true,
      videoKey: uploadInfo.videoKey,
      courseId: uploadInfo.courseId,
      lessonId: uploadInfo.lessonId,
      message: 'Video uploaded successfully'
    };
  } catch (error) {
    console.error('❌ Video upload workflow failed:', error);
    throw error;
  }
};

// 🔄 Poll transcode status until ready
export const pollTranscodeStatus = async (courseId, lessonId, maxRetries = 30, interval = 10000) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const status = await getTranscodeStatus(courseId, lessonId);
      
      if (status.isTranscoded) {
        console.log('✅ Video transcoding completed');
        return { success: true, status: 'ready' };
      }
      
      console.log(`🔄 Transcoding in progress... (${retries + 1}/${maxRetries})`);
      retries++;
      
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error('❌ Error checking transcode status:', error);
      retries++;
      
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }
  
  throw new Error('Transcoding timeout - max retries exceeded');
};

export default {
  generateUploadUrl,
  deleteVideo,
  getBucketInfo,
  getTranscodeStatus,
  uploadVideoToS3,
  uploadVideoWorkflow,
  pollTranscodeStatus
};
