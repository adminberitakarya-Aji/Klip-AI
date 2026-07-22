import { logger } from "@klipai/core/logger";

export interface FFmpegConcatInput {
  filePath: string;
  duration: number;
}

export interface FFmpegServiceOptions {
  codec?: string;
  transition?: string;
  transitionDuration?: number;
}

export class FFmpegService {
  private static instance: FFmpegService;
  private ffmpegPath: string;

  private constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  }

  static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  /**
   * Concatenate multiple video files using FFmpeg concat demuxer (fast, lossless)
   */
  async concatVideos(
    inputs: FFmpegConcatInput[],
    outputPath: string,
    options: FFmpegServiceOptions = {},
  ): Promise<string> {
    const { createWriteStream } = await import("fs");
    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");

    const execFileAsync = promisify(execFile);

    const concatFilePath = join(tmpdir(), `concat_${Date.now()}.txt`);
    const concatContent = inputs
      .map((input) => `file '${input.filePath.replace(/'/g, "'\\''")}'`)
      .join("\n");

    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(concatFilePath);
      ws.write(concatContent);
      ws.end();
      ws.on("finish", resolve);
      ws.on("error", reject);
    });

    try {
      const args = ["-y", "-f", "concat", "-safe", "0", "-i", concatFilePath];

      if (options.codec === "copy") {
        args.push("-c", "copy");
      } else {
        args.push(
          "-c:v",
          "libx264",
          "-preset",
          "medium",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
        );
      }

      args.push(outputPath);

      const { stdout, stderr } = await execFileAsync(this.ffmpegPath, args, {
        timeout: 300000,
      });

      logger.info("FFmpeg concat completed", { stdout, stderr, outputPath });
      return outputPath;
    } finally {
      try {
        const { unlinkSync } = await import("fs");
        unlinkSync(concatFilePath);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Add crossfade transitions between videos (requires re-encode)
   */
  async concatWithTransitions(
    inputs: FFmpegConcatInput[],
    outputPath: string,
    transitionDuration: number = 0.5,
  ): Promise<string> {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    let filterComplex = "";
    let lastLabel = "v0";

    for (let i = 0; i < inputs.length; i++) {
      const label = `v${i}`;
      if (i === 0) {
        filterComplex += `[${i}:v]setpts=PTS-STARTPTS[${label}];`;
      } else {
        filterComplex += `[${i}:v]setpts=PTS-STARTPTS[${label}];`;
        const prevLabel = `v${i - 1}`;
        const nextLabel = `xfade${i}`;
        const offset =
          inputs.slice(0, i).reduce((sum, inpt) => sum + inpt.duration, 0) -
          transitionDuration;
        filterComplex += `[${prevLabel}][${label}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${nextLabel}];`;
        lastLabel = nextLabel;
      }
    }

    filterComplex += `[${lastLabel}]format=yuv420p[v]`;

    const args = [
      "-y",
      ...inputs.flatMap((_, i) => ["-i", inputs[i].filePath]),
      "-filter_complex",
      filterComplex,
      "-map",
      "[v]",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-movflags",
      "+faststart",
      outputPath,
    ];

    const { stdout, stderr } = await execFileAsync(this.ffmpegPath, args, {
      timeout: 600000,
    });

    logger.info("FFmpeg concat with transitions completed", {
      stdout,
      stderr,
      outputPath,
    });
    return outputPath;
  }
}
