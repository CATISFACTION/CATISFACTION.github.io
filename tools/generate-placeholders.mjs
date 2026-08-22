import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

const width = 1600;
const height = 1067;

const scenes = [
  {
    dir: "atrium-residence",
    base: [226, 222, 213],
    accent: [156, 128, 92],
    dark: [42, 40, 36],
    light: [248, 246, 240],
    type: "atrium",
  },
  {
    dir: "gallery-loft",
    base: [230, 229, 225],
    accent: [38, 40, 42],
    dark: [20, 22, 23],
    light: [250, 250, 248],
    type: "loft",
  },
  {
    dir: "linen-house-suite",
    base: [218, 211, 202],
    accent: [132, 108, 86],
    dark: [54, 50, 45],
    light: [246, 242, 236],
    type: "suite",
  },
  {
    dir: "courtyard-studio",
    base: [224, 225, 218],
    accent: [93, 118, 92],
    dark: [46, 52, 45],
    light: [246, 246, 240],
    type: "studio",
  },
  {
    dir: "penthouse-library",
    base: [70, 62, 54],
    accent: [188, 150, 91],
    dark: [19, 18, 16],
    light: [215, 201, 180],
    type: "library",
  },
];

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makePng(w, h, paint) {
  const pixels = new Uint8Array(w * h * 4);
  const api = makePainter(pixels, w, h);
  paint(api);

  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y += 1) {
    const rowStart = y * stride;
    raw[rowStart] = 0;
    raw.set(pixels.subarray(y * w * 4, (y + 1) * w * 4), rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makePainter(pixels, w, h) {
  function index(x, y) {
    return (y * w + x) * 4;
  }

  function put(x, y, color, alpha = color[3] ?? 255) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = index(x | 0, y | 0);
    const a = alpha / 255;
    const inv = 1 - a;
    pixels[i] = Math.round(color[0] * a + pixels[i] * inv);
    pixels[i + 1] = Math.round(color[1] * a + pixels[i + 1] * inv);
    pixels[i + 2] = Math.round(color[2] * a + pixels[i + 2] * inv);
    pixels[i + 3] = 255;
  }

  function fill(color) {
    for (let y = 0; y < h; y += 1) {
      const t = y / h;
      for (let x = 0; x < w; x += 1) {
        const shade = (noise(x, y) - 0.5) * 8;
        const i = index(x, y);
        pixels[i] = clamp(color[0] + shade - t * 16);
        pixels[i + 1] = clamp(color[1] + shade - t * 14);
        pixels[i + 2] = clamp(color[2] + shade - t * 11);
        pixels[i + 3] = 255;
      }
    }
  }

  function rect(x, y, rw, rh, color, alpha = 255) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(w, Math.ceil(x + rw));
    const y1 = Math.min(h, Math.ceil(y + rh));
    for (let yy = y0; yy < y1; yy += 1) {
      for (let xx = x0; xx < x1; xx += 1) put(xx, yy, color, alpha);
    }
  }

  function line(x0, y0, x1, y1, color, thickness = 2, alpha = 255) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i += 1) {
      const x = x0 + (dx * i) / steps;
      const y = y0 + (dy * i) / steps;
      rect(x - thickness / 2, y - thickness / 2, thickness, thickness, color, alpha);
    }
  }

  function ellipse(cx, cy, rx, ry, color, alpha = 255) {
    const x0 = Math.max(0, Math.floor(cx - rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const x1 = Math.min(w, Math.ceil(cx + rx));
    const y1 = Math.min(h, Math.ceil(cy + ry));
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) put(x, y, color, alpha);
      }
    }
  }

  return { fill, rect, line, ellipse, w, h };
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function scene(theme, variant) {
  return makePng(width, height, (p) => {
    const { base, dark, light } = theme;
    p.fill(base);

    p.rect(0, 585, width, 482, mix(base, dark, 0.18), 230);
    p.line(0, 586, width, 586, mix(dark, base, 0.35), 2, 120);
    for (let x = -300; x < width + 200; x += 180) {
      p.line(x, height, width / 2, 585, mix(dark, base, 0.42), 1, 70);
    }
    for (let y = 670; y < height; y += 92) {
      p.line(0, y, width, y - 36, mix(light, base, 0.3), 1, 50);
    }

    if (theme.type === "atrium") drawAtrium(p, theme, variant);
    if (theme.type === "loft") drawLoft(p, theme, variant);
    if (theme.type === "suite") drawSuite(p, theme, variant);
    if (theme.type === "studio") drawStudio(p, theme, variant);
    if (theme.type === "library") drawLibrary(p, theme, variant);

    p.rect(0, 0, width, height, [0, 0, 0], variant === 0 ? 8 : 12);
    p.rect(0, 0, width, 120, [255, 255, 255], 18);
  });
}

function drawAtrium(p, theme, variant) {
  const { accent, dark, light } = theme;
  p.rect(940, 130, 320, 530, light, 178);
  p.rect(975, 160, 76, 460, [255, 255, 255], 190);
  p.rect(1085, 160, 76, 460, [255, 255, 255], 170);
  p.rect(1195, 160, 36, 460, mix(light, accent, 0.15), 170);
  p.line(910, 640, 1330, 635, dark, 4, 140);
  p.line(870, 735, 1185, 470, dark, 8, 105);
  p.line(895, 775, 1240, 505, dark, 5, 80);
  p.rect(250, 690, 430, 128, mix(light, accent, 0.2), 245);
  p.ellipse(500, 674, 210, 38, [0, 0, 0], 40);
  p.rect(715, 724, 240, 72, mix(accent, light, 0.32), 235);
  p.ellipse(835, 718, 130, 32, [0, 0, 0], 34);
  p.rect(250, 290, 265, 330, mix(accent, light, 0.42), 105);
  if (variant > 0) {
    p.rect(104, 392, 525, 32, accent, 125);
    p.rect(132, 436, 168, 220, mix(light, accent, 0.12), 150);
  }
}

function drawLoft(p, theme, variant) {
  const { accent, dark, light } = theme;
  for (let i = 0; i < 5; i += 1) {
    const x = 240 + i * 205;
    p.rect(x, 140, 150, 360, light, 170);
    p.rect(x, 140, 150, 360, dark, 28);
    p.line(x, 140, x, 500, accent, 6, 170);
    p.line(x + 150, 140, x + 150, 500, accent, 6, 170);
    p.line(x, 318, x + 150, 318, accent, 5, 150);
  }
  p.rect(144, 636, 480, 74, mix(dark, light, 0.08), 232);
  p.rect(170, 590, 130, 84, mix(light, dark, 0.25), 230);
  p.rect(344, 582, 132, 92, mix(light, dark, 0.2), 230);
  p.rect(760, 698, 432, 52, dark, 210);
  p.rect(810, 630, 330, 78, mix(light, accent, 0.1), 220);
  p.line(680, 640, 1260, 580, dark, 4, 95);
  if (variant > 0) {
    p.rect(1010, 340, 250, 175, [255, 255, 255], 140);
    p.rect(1040, 368, 190, 118, dark, 115);
  }
}

function drawSuite(p, theme, variant) {
  const { accent, dark, light } = theme;
  p.rect(200, 248, 460, 432, mix(light, accent, 0.12), 210);
  p.rect(250, 424, 630, 278, mix(light, accent, 0.18), 250);
  p.rect(250, 380, 630, 72, mix(light, accent, 0.05), 238);
  p.rect(292, 625, 548, 96, mix(light, [255, 255, 255], 0.42), 255);
  p.rect(980, 260, 260, 500, mix(accent, dark, 0.22), 205);
  p.rect(1000, 285, 220, 440, mix(light, accent, 0.16), 96);
  p.line(170, 270, 910, 270, accent, 5, 90);
  p.ellipse(1120, 770, 148, 64, dark, 58);
  if (variant > 0) {
    p.rect(1040, 495, 250, 66, mix(light, accent, 0.25), 230);
    p.rect(1095, 358, 136, 108, light, 150);
  }
}

function drawStudio(p, theme, variant) {
  const { accent, dark, light } = theme;
  p.rect(875, 145, 385, 520, mix(light, accent, 0.1), 188);
  p.rect(932, 185, 270, 410, [210, 226, 205], 130);
  for (let i = 0; i < 8; i += 1) {
    p.line(955 + i * 32, 592, 1098 + i * 15, 214, accent, 5, 72);
  }
  p.rect(290, 660, 600, 72, mix(light, accent, 0.25), 240);
  p.rect(350, 724, 18, 160, dark, 145);
  p.rect(792, 724, 18, 160, dark, 145);
  p.rect(176, 420, 420, 220, mix(light, [255, 255, 255], 0.32), 170);
  p.ellipse(1120, 650, 82, 160, accent, 75);
  if (variant > 0) {
    p.rect(190, 324, 220, 230, mix(light, accent, 0.2), 175);
    p.line(190, 554, 410, 324, dark, 3, 70);
  }
}

function drawLibrary(p, theme, variant) {
  const { accent, dark, light } = theme;
  p.rect(100, 120, 410, 615, mix(dark, accent, 0.16), 230);
  p.rect(525, 120, 410, 615, mix(dark, accent, 0.12), 228);
  for (let x = 145; x < 910; x += 95) {
    p.line(x, 145, x, 700, light, 2, 48);
  }
  for (let y = 210; y < 690; y += 95) {
    p.line(120, y, 915, y, light, 2, 46);
  }
  p.rect(1015, 160, 410, 350, [23, 26, 28], 210);
  for (let y = 205; y < 430; y += 44) {
    p.line(1030, y, 1400, y + 16, accent, 2, 75);
  }
  p.rect(245, 720, 545, 108, mix(light, accent, 0.18), 225);
  p.rect(860, 735, 275, 82, mix(accent, light, 0.22), 210);
  p.ellipse(572, 678, 260, 42, [0, 0, 0], 70);
  if (variant > 0) {
    p.rect(1132, 545, 220, 150, mix(light, accent, 0.08), 115);
    p.ellipse(1242, 550, 74, 28, accent, 105);
  }
}

function profileImage() {
  return makePng(900, 1100, (p) => {
    p.fill([225, 223, 217]);
    p.rect(0, 650, 900, 450, [206, 201, 190], 170);
    p.rect(110, 130, 680, 640, [245, 243, 237], 135);
    p.line(110, 770, 790, 130, [120, 108, 91], 4, 45);
    p.ellipse(450, 375, 132, 152, [70, 67, 62], 235);
    p.rect(330, 500, 240, 105, [70, 67, 62], 220);
    p.ellipse(450, 760, 275, 245, [40, 39, 37], 230);
    p.ellipse(450, 342, 86, 108, [205, 184, 160], 255);
    p.rect(380, 452, 140, 132, [205, 184, 160], 245);
    p.rect(185, 835, 530, 265, [26, 25, 24], 210);
    p.line(230, 870, 690, 870, [199, 168, 113], 3, 95);
  });
}

function mix(a, b, amount) {
  return [
    a[0] * (1 - amount) + b[0] * amount,
    a[1] * (1 - amount) + b[1] * amount,
    a[2] * (1 - amount) + b[2] * amount,
  ];
}

function save(path, png) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
  console.log(path);
}

save("public/uploads/profile/maya-voss-profile.png", profileImage());

for (const theme of scenes) {
  save(`public/uploads/projects/${theme.dir}/cover.png`, scene(theme, 0));
  save(`public/uploads/projects/${theme.dir}/gallery-1.png`, scene(theme, 1));
  save(`public/uploads/projects/${theme.dir}/gallery-2.png`, scene(theme, 2));
}
