import type { NextConfig } from "next";
import os from "os";

// Deteksi otomatis seluruh IP lokal mesin untuk akses via jaringan LAN
const networkIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface): iface is os.NetworkInterfaceInfo => Boolean(iface && iface.family === "IPv4"))
  .map((iface) => iface.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...networkIps,
    "20.22.20.*",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "localhost",
    "127.0.0.1",
    "*.trycloudflare.com",
    "trycloudflare.com",
  ],
};

export default nextConfig;
