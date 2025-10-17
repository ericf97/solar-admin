"use client";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useState, useEffect, useRef, useCallback } from "react";

interface UnityLoaderProps {
  buildPath?: string;
  buildName?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnityInstance?: (instance: any) => void;
}

export default function UnityLoader({
  buildPath = "/unity",
  buildName = "solar_web_build",
  width = "100%",
  height = "600px",
  className = "",
  onLoaded,
  onError,
  onUnityInstance,
}: UnityLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const hasNotifiedInstance = useRef(false);

  const {
    unityProvider,
    isLoaded: unityIsLoaded,
    loadingProgression,
    addEventListener,
    removeEventListener,
    sendMessage,
  } = useUnityContext({
    loaderUrl: `${buildPath}/${buildName}.loader.js`,
    dataUrl: `${buildPath}/${buildName}.data`,
    frameworkUrl: `${buildPath}/${buildName}.framework.js`,
    codeUrl: `${buildPath}/${buildName}.wasm`,
  });

  const stableSendMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (objectName: string, methodName: string, parameter?: any) => {
      sendMessage(objectName, methodName, parameter);
    },
    [sendMessage]
  );

  useEffect(() => {
    setLoadingProgress(Math.round(loadingProgression * 100));
  }, [loadingProgression]);

  useEffect(() => {
    if (unityIsLoaded && !isLoaded) {
      setIsLoaded(true);
      onLoaded?.();

      if (onUnityInstance && !hasNotifiedInstance.current) {
        hasNotifiedInstance.current = true;
        onUnityInstance({ SendMessage: stableSendMessage });
      }
    }
  }, [unityIsLoaded, isLoaded, onLoaded, onUnityInstance, stableSendMessage]);

  useEffect(() => {
    return () => {
      if (onUnityInstance && hasNotifiedInstance.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUnityInstance(undefined as any);
        } catch {
          console.warn("Failed to notify Unity instance unload");
        } finally {
          hasNotifiedInstance.current = false;
        }
      }
    };
  }, [onUnityInstance]);

  useEffect(() => {
    const handleError = (message: string) => {
      setHasError(true);
      onError?.(message);
    };

    addEventListener("error", handleError);

    return () => {
      removeEventListener("error", handleError);
    };
  }, [addEventListener, removeEventListener, onError]);

  if (hasError) {
    return (
      <div className={`unity-error ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Error loading Unity application</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`unity-container ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div className="unity-loading flex items-center justify-center h-full">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <p className="text-gray-600">Loading Unity... {loadingProgress}%</p>
          </div>
        </div>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{
          width: "100%",
          height: "100%",
          display: isLoaded ? "block" : "none",
        }}
      />
    </div>
  );
}

