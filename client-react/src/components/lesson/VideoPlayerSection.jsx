import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from '../../redux/api/slices/authSlice';
import authUtils from '../../utils/authUtils';
import LMSVideoPlayer from './LMSVideoPlayer';

const VideoPlayerSection = ({ lesson, onProgress, onVideoEnd }) => {
  const dispatch = useDispatch();
  const [userLoaded, setUserLoaded] = useState(false);
  
  // Get auth state from Redux
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  
  // Load user info if authenticated but no user data
  useEffect(() => {
    const loadUser = async () => {
      if (token && isAuthenticated && !user) {
        console.log('🔄 Loading user info...');
        try {
          await dispatch(fetchMe()).unwrap();
          console.log('✅ User info loaded');
        } catch (error) {
          console.warn('⚠️ Failed to load user info:', error);
        }
      }
      setUserLoaded(true);
    };

    loadUser();
  }, [dispatch, token, isAuthenticated, user]);

  // Get user ID from multiple sources
  const getUserId = () => {
    // First priority: Redux user
    if (user?.userId) return user.userId;
    
    // Second priority: Decode from JWT token
    const userIdFromToken = authUtils.getCurrentUserId();
    if (userIdFromToken) return userIdFromToken;
    
    return null;
  };

  const userId = getUserId();

  return <LMSVideoPlayer lesson={lesson} userId={userId} onProgress={onProgress} onVideoEnd={onVideoEnd} />;
};

export default VideoPlayerSection;