import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeviceInfo {
  device_id: string;
  device_type: string;
  online_at: string;
}

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Dispositivo';
};

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('bella-device-id');
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bella-device-id', deviceId);
  }
  return deviceId;
};

export function useDevicePresence() {
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);

  useEffect(() => {
    const deviceId = getDeviceId();
    const deviceType = getDeviceType();

    const channel = supabase.channel('bella-presence', {
      config: {
        presence: {
          key: deviceId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<DeviceInfo>();
        const devices: DeviceInfo[] = [];
        
        Object.values(state).forEach((presenceList) => {
          presenceList.forEach((presence) => {
            devices.push(presence as DeviceInfo);
          });
        });
        
        setConnectedDevices(devices);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Device joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Device left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            device_id: deviceId,
            device_type: deviceType,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    connectedDevices,
    deviceCount: connectedDevices.length,
  };
}
