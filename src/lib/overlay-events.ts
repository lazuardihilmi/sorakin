import { EventEmitter } from "events";

class OverlayEventEmitter extends EventEmitter {}

// Global object to persist across Next.js dev hot-reloads
const globalForOverlay = globalThis as unknown as { overlayEmitter: OverlayEventEmitter };

export const overlayEmitter = globalForOverlay.overlayEmitter || new OverlayEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForOverlay.overlayEmitter = overlayEmitter;
}

export interface DonationAlertEvent {
  orderId: string;
  creatorId: number;
  senderName: string;
  amount: number;
  message: string;
  isVerified: boolean;
  activeThemeId: number;
  alertSoundUrl: string;
  alertImageUrl: string;
  alertDuration: number;
  fontFamily: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  alertTemplate: string;
  // Dynamic Widget Extensions
  milestoneGoal?: any;
  subathonTimer?: any;
  votingPoll?: any;
  soundboardPlay?: any;
  mediashareAdd?: any;
}

export function triggerDonationAlert(creatorKey: string, alert: DonationAlertEvent) {
  overlayEmitter.emit(`alert:${creatorKey}`, alert);
}
