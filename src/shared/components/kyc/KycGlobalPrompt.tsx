import { isKycApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useKycGateStore } from "@/src/lib/store/kyc-gate.store";
import React, { useEffect, useRef, useState } from "react";
import { KycPromptModal } from "./KycPromptModal";

/**
 * Renders in `app/(private)/_layout.tsx`. Opens when another screen calls `blockIfKycNotApproved()`.
 */
export function KycGlobalPrompt() {
  const [visible, setVisible] = useState(false);
  const requestNonce = useKycGateStore((s) => s.requestNonce);
  const lastNonce = useRef(0);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (requestNonce <= 0 || requestNonce === lastNonce.current) return;
    lastNonce.current = requestNonce;
    if (!isKycApproved(profile?.kyc_status)) {
      setVisible(true);
    }
  }, [requestNonce, profile?.kyc_status]);

  useEffect(() => {
    if (isKycApproved(profile?.kyc_status)) {
      setVisible(false);
    }
  }, [profile?.kyc_status]);

  return (
    <KycPromptModal visible={visible} onClose={() => setVisible(false)} />
  );
}
