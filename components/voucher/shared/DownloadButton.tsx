"use client";

import { PrintableData } from "../voucher-view/CashVoucher/types";
import * as htmlToImage from "html-to-image";

interface DownloadButtonProps {
  formData: PrintableData;
}

export default function DownloadButton({ formData }: DownloadButtonProps) {
const handleDownload = async () => {
  const element = document.getElementById("printable-content");
  if (!element) return;

  // Step 1: Export original at high resolution
  const originalDataUrl = await htmlToImage.toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
  });

  const img = new Image();
  img.src = originalDataUrl;

  img.onload = () => {
    const ORIGINAL_WIDTH = img.width;
    const ORIGINAL_HEIGHT = img.height;

    // Cheque-like ratio target (wider, shorter)
    const TARGET_WIDTH = ORIGINAL_WIDTH ;
    const TARGET_HEIGHT = ORIGINAL_HEIGHT; // 2.4 ratio

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw image compressed vertically
    ctx.drawImage(
      img,
      0,
      0,
      ORIGINAL_WIDTH,
      ORIGINAL_HEIGHT,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const finalImage = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = `voucher-${formData.voucherNo || "cheque"}.png`;
    link.href = finalImage;
    link.click();
  };
//   img.onload = () => {
//   const ORIGINAL_WIDTH = img.width;
//   const ORIGINAL_HEIGHT = img.height;

//   // Make it longer horizontally (15% wider)
//   const TARGET_WIDTH = ORIGINAL_WIDTH * 1.15;

//   // Make it shorter vertically (30% shorter)
//   const TARGET_HEIGHT = ORIGINAL_HEIGHT * 0.7;

//   const canvas = document.createElement("canvas");
//   canvas.width = TARGET_WIDTH;
//   canvas.height = TARGET_HEIGHT;

//   const ctx = canvas.getContext("2d");
//   if (!ctx) return;

//   ctx.fillStyle = "#ffffff";
//   ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

//   ctx.drawImage(
//     img,
//     0,
//     0,
//     ORIGINAL_WIDTH,
//     ORIGINAL_HEIGHT,
//     0,
//     0,
//     TARGET_WIDTH,
//     TARGET_HEIGHT
//   );

//   const finalImage = canvas.toDataURL("image/png");

//   const link = document.createElement("a");
//   link.download = `voucher-${formData.voucherNo || "cheque"}.png`;
//   link.href = finalImage;
//   link.click();
// };
};

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
    >
      Export as image
    </button>
  );
}