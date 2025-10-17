/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UnityInstance {
  SendMessage: (
    objectName: string,
    methodName: string,
    parameter?: string
  ) => void;
}

export interface TrainingStatusMessage {
  status: "training" | "complete" | "error";
  currentEpoch: number;
  totalEpochs: number;
  loss: number;
  errorMessage?: string;
}

export interface NlpReplyMessage {
  tag: string;
  text: string;
  options?: Array<{
    label: string;
    text: string;
    tag: string;
  }>;
  visualCue?: {
    face?: { id: string; intensity: number };
    body?: { id: string; intensity: number };
  };
  confidence: number;
  isFallback: boolean;
  isObjective: boolean;
  isRepeatedInput: boolean;
}

export interface FallbackRequestMessage {
  userInput: string;
  predictedTag: string;
  confidence: number;
}

type MessageHandler<T> = (data: T) => void;

interface MessageHandlers {
  trainingStatus: MessageHandler<TrainingStatusMessage>[];
  nlpReply: MessageHandler<NlpReplyMessage>[];
  fallbackRequest: MessageHandler<FallbackRequestMessage>[];
}

class UnityBridgeService {
  private unityInstance: UnityInstance | null = null;
  private messageHandlers: MessageHandlers = {
    trainingStatus: [],
    nlpReply: [],
    fallbackRequest: [],
  };
  private isInitialized = false;
  private readyCheckInterval: NodeJS.Timeout | null = null;
  private isUnityBridgeReady = false;
  private unityMessageHandler: ((...parameters: any[]) => void) | null = null;
  private unityBridgeReadyResolve: (() => void) | null = null;
  private unityBridgeReadyPromise: Promise<void>;

  constructor() {
    this.unityBridgeReadyPromise = new Promise<void>(resolve => {
      this.unityBridgeReadyResolve = resolve;
    });
  }

  initialize(instance: UnityInstance) {
    if (this.isInitialized) {
      console.warn("[UnityBridge] Already initialized");
      return;
    }

    this.unityInstance = instance;

    this.unityMessageHandler = this.handleUnityMessage.bind(this);

    (window as any).dispatchReactUnityEvent = (
      eventName: string,
      ...args: any[]
    ) => {
      if (eventName === "UnityBridgeReady") {
        this.isUnityBridgeReady = true;
        if (this.readyCheckInterval) {
          clearInterval(this.readyCheckInterval);
          this.readyCheckInterval = null;
        }
        if (this.unityBridgeReadyResolve) {
          this.unityBridgeReadyResolve();
          this.unityBridgeReadyResolve = null;
        }
        return;
      }

      if (eventName === "UnityMessage") {
        const message = args[0];
        if (this.unityMessageHandler) {
          this.unityMessageHandler(message);
        } else {
          console.error("[UnityBridge] ✗ unityMessageHandler is null!");
        }
      } else {
        console.warn(`[UnityBridge] Unknown event: ${eventName}`);
      }
    };

    (window as any).onUnityBridgeReady = () => {
      this.isUnityBridgeReady = true;
      if (this.readyCheckInterval) {
        clearInterval(this.readyCheckInterval);
        this.readyCheckInterval = null;
      }
      if (this.unityBridgeReadyResolve) {
        this.unityBridgeReadyResolve();
        this.unityBridgeReadyResolve = null;
      }
    };

    if (typeof (window as any).dispatchReactUnityEvent === "function") {
    } else {
      console.error("[UnityBridge] ✗ Failed to set global callback!");
    }

    this.isInitialized = true;

    this.checkUnityBridgeReady();
  }

  private checkUnityBridgeReady() {
    let attempts = 0;
    const maxAttempts = 100;

    this.readyCheckInterval = setInterval(() => {
      attempts++;

      if (this.isUnityBridgeReady) {
        if (this.readyCheckInterval) {
          clearInterval(this.readyCheckInterval);
          this.readyCheckInterval = null;
        }
        return;
      }

      try {
        this.unityInstance!.SendMessage(
          "ReactUnityBridge",
          "ReceiveTrainAgent",
          JSON.stringify({ agentJson: '{"test":true}' })
        );

        this.isUnityBridgeReady = true;
        if (this.readyCheckInterval) {
          clearInterval(this.readyCheckInterval);
          this.readyCheckInterval = null;
        }
        if (this.unityBridgeReadyResolve) {
          this.unityBridgeReadyResolve();
          this.unityBridgeReadyResolve = null;
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          console.error(
            "[UnityBridge] ✗ ReactUnityBridge not found after maximum attempts",
            error
          );
          if (this.readyCheckInterval) {
            clearInterval(this.readyCheckInterval);
            this.readyCheckInterval = null;
          }
        }
      }
    }, 100);
  }

  isReady(): boolean {
    return (
      this.isInitialized &&
      this.unityInstance !== null &&
      this.isUnityBridgeReady
    );
  }

  async waitForReady(timeoutMs: number = 10000): Promise<boolean> {
    try {
      await Promise.race([
        this.unityBridgeReadyPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);

      return true;
    } catch (error) {
      console.error("[UnityBridge] ✗ Timeout waiting for Unity bridge", error);
      return false;
    }
  }

  async trainAgent(agentJson: string) {
    if (!this.isInitialized || !this.unityInstance) {
      console.error("[UnityBridge] Unity not initialized");
      throw new Error("Unity not initialized");
    }

    const ready = await this.waitForReady(10000);

    if (!ready) {
      throw new Error("Unity ReactUnityBridge not ready");
    }

    const payload = { agentJson };

    try {
      if (typeof this.unityInstance.SendMessage !== "function") {
        throw new Error("SendMessage is not available on Unity instance");
      }

      this.unityInstance.SendMessage(
        "ReactUnityBridge",
        "ReceiveTrainAgent",
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("[UnityBridge] Error sending train agent:", error);

      if (error instanceof Error && error.message.includes("null function")) {
        throw new Error(
          "Unity bridge is not ready. Please wait a moment and try again."
        );
      }

      throw new Error(
        `Failed to train agent: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  sendUserMessage(message: string) {
    if (!this.isReady()) {
      console.error("[UnityBridge] Unity not initialized or not ready");
      return;
    }

    try {
      if (typeof this.unityInstance!.SendMessage !== "function") {
        console.error("[UnityBridge] SendMessage is not available");
        return;
      }

      const payload = { message };

      this.unityInstance!.SendMessage(
        "ReactUnityBridge",
        "ReceiveUserMessage",
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("[UnityBridge] Error sending user message:", error);
    }
  }

  sendVoiceReply(
    visualCue: any,
    audioBase64: string,
    audioEncoding: string = "LINEAR16",
    sampleRate: number = 24000
  ) {
    if (!this.isReady()) {
      console.error("[UnityBridge] Unity not initialized or not ready");
      return;
    }

    try {
      if (typeof this.unityInstance!.SendMessage !== "function") {
        console.error("[UnityBridge] SendMessage is not available");
        return;
      }

      const payload = {
        visualCue,
        audioBase64,
        audioEncoding,
        sampleRate,
      };

      this.unityInstance!.SendMessage(
        "ReactUnityBridge",
        "ReceiveVoiceReply",
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("[UnityBridge] Error sending voice reply:", error);
    }
  }

  sendFallbackResponse(text: string, visualCue?: any) {
    if (!this.isReady()) {
      console.error("[UnityBridge] Unity not initialized or not ready");
      return;
    }

    try {
      if (typeof this.unityInstance!.SendMessage !== "function") {
        console.error("[UnityBridge] SendMessage is not available");
        return;
      }

      const payload = { text, visualCue };

      this.unityInstance!.SendMessage(
        "ReactUnityBridge",
        "ReceiveFallbackResponse",
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("[UnityBridge] Error sending fallback response:", error);
    }
  }

  onTrainingStatus(handler: MessageHandler<TrainingStatusMessage>): () => void {
    this.messageHandlers.trainingStatus.push(handler);
    return () => {
      const index = this.messageHandlers.trainingStatus.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.trainingStatus.splice(index, 1);
      }
    };
  }

  onNlpReply(handler: MessageHandler<NlpReplyMessage>): () => void {
    this.messageHandlers.nlpReply.push(handler);
    return () => {
      const index = this.messageHandlers.nlpReply.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.nlpReply.splice(index, 1);
      }
    };
  }

  onFallbackRequest(
    handler: MessageHandler<FallbackRequestMessage>
  ): () => void {
    this.messageHandlers.fallbackRequest.push(handler);
    return () => {
      const index = this.messageHandlers.fallbackRequest.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.fallbackRequest.splice(index, 1);
      }
    };
  }

  private handleUnityMessage(...args: any[]) {
    const message = args[0];

    if (typeof message !== "string") {
      console.error("[UnityBridge] Message is not a string:", typeof message);
      return;
    }

    try {
      const parsed = JSON.parse(message);
      const { type, data } = parsed;

      switch (type) {
        case "trainingStatus":
          this.messageHandlers.trainingStatus.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error(
                "[UnityBridge] Error in training status handler:",
                error
              );
            }
          });
          break;

        case "nlpReply":
          this.messageHandlers.nlpReply.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error("[UnityBridge] Error in NLP reply handler:", error);
            }
          });
          break;

        case "fallbackRequest":
          this.messageHandlers.fallbackRequest.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error(
                "[UnityBridge] Error in fallback request handler:",
                error
              );
            }
          });
          break;

        default:
          console.warn(`[UnityBridge] Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error("[UnityBridge] Error parsing Unity message:", error);
    }
  }

  cleanup() {
    if (this.readyCheckInterval) {
      clearInterval(this.readyCheckInterval);
      this.readyCheckInterval = null;
    }

    if ((window as any).dispatchReactUnityEvent) {
      delete (window as any).dispatchReactUnityEvent;
    }

    this.unityMessageHandler = null;

    this.messageHandlers = {
      trainingStatus: [],
      nlpReply: [],
      fallbackRequest: [],
    };
    this.unityInstance = null;
    this.isInitialized = false;
    this.isUnityBridgeReady = false;
  }
}

export const unityBridgeService = new UnityBridgeService();

