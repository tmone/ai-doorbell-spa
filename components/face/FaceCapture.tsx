import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import ml from '@react-native-firebase/ml';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '../../hooks/useThemeColor';

// Directions that we want to capture the face from
const CAPTURE_DIRECTIONS = [
  { id: 'front', label: 'front', targetYaw: 0, targetPitch: 0, complete: false },
  { id: 'left', label: 'left', targetYaw: -30, targetPitch: 0, complete: false },
  { id: 'right', label: 'right', targetYaw: 30, targetPitch: 0, complete: false },
  { id: 'up', label: 'up', targetYaw: 0, targetPitch: -15, complete: false },
  { id: 'down', label: 'down', targetYaw: 0, targetPitch: 15, complete: false },
];

// Tolerance values for considering a face angle as matching the target
const YAW_TOLERANCE = 10;
const PITCH_TOLERANCE = 10;

// Timeout before capture (give user time to hold the position)
const CAPTURE_DELAY = 1000;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_RATIO = 4 / 3;

interface FaceCaptureProps {
  onComplete: (images: Array<{ uri: string; angle: string }>) => void;
  onCancel: () => void;
}

export default function FaceCapture({ onComplete, onCancel }: FaceCaptureProps) {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<Array<{ uri: string; angle: string }>>([]);
  const [currentDirection, setCurrentDirection] = useState(CAPTURE_DIRECTIONS[0]);
  const [directions, setDirections] = useState([...CAPTURE_DIRECTIONS]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMatchingTarget, setFaceMatchingTarget] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [faceDetectionSupported, setFaceDetectionSupported] = useState(true);
  const [mlKitSupported, setMlKitSupported] = useState(true);
  
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<Camera>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const buttonPrimaryColor = useThemeColor({}, 'buttonPrimary');
  const buttonDangerColor = useThemeColor({}, 'buttonDanger');

  // Request camera permission on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      try {
        // Check if ML Kit face detection is supported on this device
        if (Platform.OS !== 'web') {
          const isMLSupported = await ml().isModelDownloaded('face');
          setMlKitSupported(isMLSupported);
          
          if (!isMLSupported) {
            // Try to download the model if not available
            try {
              await ml().downloadModel('face');
              setMlKitSupported(true);
            } catch (err) {
              console.error('Failed to download face model', err);
              setMlKitSupported(false);
            }
          }
        } else {
          // ML Kit is not supported on web
          setMlKitSupported(false);
        }
      } catch (err) {
        console.error('Error checking ML kit support', err);
        setMlKitSupported(false);
      }
    })();

    return () => {
      // Clear the capture timeout if component unmounts
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

  // Update the current direction when one is completed
  useEffect(() => {
    const incompleteDirections = directions.filter(d => !d.complete);
    if (incompleteDirections.length > 0) {
      setCurrentDirection(incompleteDirections[0]);
    } else if (directions.every(d => d.complete)) {
      // All directions captured, finish the process
      setProcessing(true);
      finalizeFaceCapture();
    }
  }, [directions]);

  // Handle face detection
  const handleFacesDetected = ({ faces }: { faces: any[] }) => {
    if (processing || !cameraReady || capturedImages.some(img => img.angle === currentDirection.id)) {
      return;
    }

    // Check if any face is detected
    if (faces.length > 0) {
      setFaceDetected(true);
      const face = faces[0]; // Use the first face detected

      // Check if face orientation matches the target orientation
      const yawDiff = Math.abs(face.yawAngle - currentDirection.targetYaw);
      const pitchDiff = Math.abs(face.rollAngle - currentDirection.targetPitch);
      
      const isMatching = yawDiff < YAW_TOLERANCE && pitchDiff < PITCH_TOLERANCE;
      
      setFaceMatchingTarget(isMatching);

      // If face matches target, start or continue countdown
      if (isMatching) {
        if (captureCountdown === null) {
          // Start countdown
          setCaptureCountdown(3);
          
          captureTimeoutRef.current = setTimeout(() => {
            captureFace(currentDirection.id);
          }, CAPTURE_DELAY);
        }
      } else {
        // Face no longer matches, reset countdown
        if (captureCountdown !== null) {
          setCaptureCountdown(null);
          if (captureTimeoutRef.current) {
            clearTimeout(captureTimeoutRef.current);
            captureTimeoutRef.current = null;
          }
        }
      }
    } else {
      // No face detected
      setFaceDetected(false);
      setFaceMatchingTarget(false);
      
      if (captureCountdown !== null) {
        setCaptureCountdown(null);
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
          captureTimeoutRef.current = null;
        }
      }
    }
  };

  // Capture the face from the current direction
  const captureFace = async (angle: string) => {
    if (!cameraRef.current || !cameraReady) return;
    
    try {
      setDetecting(true);
      
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      
      // Add to captured images
      setCapturedImages(prev => [...prev, { uri: photo.uri, angle }]);
      
      // Mark this direction as complete
      setDirections(prev => 
        prev.map(dir => (dir.id === angle ? { ...dir, complete: true } : dir))
      );
      
      // Reset states
      setCaptureCountdown(null);
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
        captureTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('Error capturing face:', err);
      Alert.alert(
        t('common.error'),
        t('profile.faceCaptureFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setDetecting(false);
    }
  };

  // Manual capture for when automatic detection is not available
  const handleManualCapture = async () => {
    if (!cameraRef.current || !cameraReady) return;
    
    try {
      setDetecting(true);
      
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });
      
      // Add to captured images
      setCapturedImages(prev => [...prev, { uri: photo.uri, angle: currentDirection.id }]);
      
      // Mark this direction as complete
      setDirections(prev => 
        prev.map(dir => (dir.id === currentDirection.id ? { ...dir, complete: true } : dir))
      );
    } catch (err) {
      console.error('Error manually capturing face:', err);
      Alert.alert(
        t('common.error'),
        t('profile.faceCaptureFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setDetecting(false);
    }
  };

  // Finalize the face capture process
  const finalizeFaceCapture = () => {
    // Pass the captured images back to the parent component
    onComplete(capturedImages);
  };

  // Get instructions for the current face direction
  const getDirectionInstructions = (direction: typeof CAPTURE_DIRECTIONS[0]) => {
    switch(direction.id) {
      case 'front': return t('profile.faceLookStraight');
      case 'left': return t('profile.faceTurnLeft');
      case 'right': return t('profile.faceTurnRight');
      case 'up': return t('profile.faceLookUp');
      case 'down': return t('profile.faceLookDown');
      default: return '';
    }
  };

  // Get appropriate status text based on current detection state
  const getStatusText = () => {
    if (!faceDetected) {
      return t('profile.noFaceDetected');
    } else if (!faceMatchingTarget) {
      return getDirectionInstructions(currentDirection);
    } else if (captureCountdown !== null) {
      return t('profile.holdStill');
    }
    return '';
  };

  // Calculate capture progress percentage
  const calculateProgress = () => {
    const completed = directions.filter(d => d.complete).length;
    return (completed / directions.length) * 100;
  };
  
  if (hasPermission === null) {
    // Still waiting for permission
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={buttonPrimaryColor} />
      </ThemedView>
    );
  }
  
  if (hasPermission === false) {
    // Permission denied
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.text}>
          {t('profile.noCameraAccess')}
        </ThemedText>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: buttonPrimaryColor }]}
          onPress={onCancel}
        >
          <ThemedText style={styles.buttonText}>
            {t('common.back')}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={buttonPrimaryColor} />
          <ThemedText style={styles.processingText}>
            {t('profile.processingFaces')}
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type="front"
              onCameraReady={() => setCameraReady(true)}
              onFacesDetected={
                faceDetectionSupported && !detecting && !processing 
                  ? handleFacesDetected 
                  : undefined
              }
              faceDetectorSettings={{
                mode: FaceDetector.FaceDetectorMode.fast,
                detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                runClassifications: FaceDetector.FaceDetectorClassifications.none,
                minDetectionInterval: 100,
                tracking: true,
              }}
            >
              <View style={styles.cameraContent}>
                {/* Face overlay */}
                <View style={styles.faceOverlay}>
                  <View style={[
                    styles.faceTargetOutline,
                    faceDetected && { borderColor: faceMatchingTarget ? '#4CAF50' : '#FFC107' },
                    !faceDetected && { borderColor: '#F44336' }
                  ]} />
                </View>
                
                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <ThemedText style={styles.instructionText}>
                    {getStatusText()}
                  </ThemedText>
                  
                  {captureCountdown !== null && (
                    <ThemedText style={styles.countdownText}>
                      {t('profile.capturingIn')}...
                    </ThemedText>
                  )}
                </View>
              </View>
            </Camera>
          </View>
          
          <ThemedView style={styles.controlsContainer}>
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <ThemedText style={styles.progressText}>
                {t('profile.captureProgress', { 
                  completed: directions.filter(d => d.complete).length,
                  total: directions.length
                })}
              </ThemedText>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${calculateProgress()}%`, backgroundColor: buttonPrimaryColor }
                  ]}
                />
              </View>
            </View>
            
            {/* Current angle thumbnail indicators */}
            <View style={styles.thumbnailsContainer}>
              {directions.map((dir, index) => (
                <View key={dir.id} style={styles.thumbnailWrapper}>
                  <View style={[
                    styles.thumbnail, 
                    { borderColor: dir.id === currentDirection.id ? buttonPrimaryColor : 'transparent' }
                  ]}>
                    {dir.complete ? (
                      <Image 
                        source={{ uri: capturedImages.find(img => img.angle === dir.id)?.uri }}
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold' }}>
                        {dir.id === 'front' ? '👤' : 
                         dir.id === 'left' ? '←' : 
                         dir.id === 'right' ? '→' : 
                         dir.id === 'up' ? '↑' : '↓'}
                      </Text>
                    )}
                  </View>
                  <ThemedText style={styles.thumbnailLabel}>
                    {t(`profile.faceAngle.${dir.id}`)}
                  </ThemedText>
                </View>
              ))}
            </View>
            
            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: buttonDangerColor }]}
                onPress={onCancel}
              >
                <ThemedText style={styles.buttonText}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              
              {/* Only show manual button if auto detection isn't working well */}
              {(!faceDetectionSupported || !mlKitSupported) && (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: buttonPrimaryColor }]}
                  onPress={handleManualCapture}
                  disabled={detecting || !cameraReady}
                >
                  <ThemedText style={styles.buttonText}>
                    {detecting ? t('profile.capturing') : t('profile.manualCapture')}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * CAMERA_RATIO,
  },
  cameraContent: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceTargetOutline: {
    width: 250,
    height: 300,
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 150,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  countdownText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  thumbnailWrapper: {
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  thumbnailLabel: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
  }
});