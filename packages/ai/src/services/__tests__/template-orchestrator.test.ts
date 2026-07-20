import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TemplateOrchestrator } from "../template-orchestrator";
import type { TemplateGenerationInput } from "../template-orchestrator";
import { GenerationType } from "../../types";

// Use vi.hoisted() to define mocks before hoisting
const mockProviderRouter = vi.hoisted(() => ({
  generate: vi.fn(),
  waitForCompletion: vi.fn(),
}));

const mockStorage = vi.hoisted(() => ({
  upload: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(true),
}));

const mockPrisma = vi.hoisted(() => ({
  storyboardTemplate: {
    findUnique: vi.fn(),
  },
  brandKit: {
    findUnique: vi.fn(),
  },
  templateGenerationJob: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock dependencies before importing the module
vi.mock("@sentry/nextjs", () => ({
  setContext: vi.fn(),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  startSpan: vi.fn().mockReturnValue({ end: vi.fn() }),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("../provider-router", () => ({
  providerRouter: mockProviderRouter,
}));

vi.mock("../storage", () => ({
  createStorageProvider: vi.fn(() => mockStorage),
}));

vi.mock("@klipai/core/storage", () => ({
  StorageProvider: vi.fn(),
}));

vi.mock("@klipai/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@klipai/core/schemas/template", () => ({
  templateGenerateSchema: {
    shape: {
      customizations: {
        unwrap: vi.fn().mockReturnValue({
          required: false,
        }),
      },
    },
    parse: vi.fn((x) => x),
  },
}));

// Helper: Create mock template
function createMockTemplate(overrides: any = {}) {
  return {
    id: "template_1",
    name: "Test Template",
    slug: "test-template",
    description: "A test template",
    category: "marketing",
    totalDuration: 30,
    aspectRatio: "9:16",
    shotCount: 3,
    creditsCost: 5,
    isPublished: true,
    shots: [
      {
        id: "shot_1",
        templateId: "template_1",
        index: 0,
        timeRange: "0-10",
        duration: 10,
        description: "Opening shot",
        prompt: "Beautiful sunrise over the city",
        negativePrompt: "blurry, watermark",
        camera: "cinematic",
        lighting: "golden hour",
        generationType: "TEXT_TO_VIDEO",
        resolution: "1080p",
        fps: 24,
        cameraMotion: "pan",
        motionStrength: 0.5,
        seed: 42,
        referenceImageUrl: null,
        referenceRole: null,
        referenceWeight: null,
        brandKitOverlays: null,
      },
      {
        id: "shot_2",
        templateId: "template_1",
        index: 1,
        timeRange: "10-20",
        duration: 10,
        description: "Product showcase",
        prompt: "Close up product shot, smooth motion",
        negativePrompt: "blurry",
        camera: "cinematic",
        lighting: "studio",
        generationType: "TEXT_TO_VIDEO",
        resolution: "1080p",
        fps: 24,
        cameraMotion: "zoom",
        motionStrength: 0.3,
        seed: 43,
        referenceImageUrl: null,
        referenceRole: null,
        referenceWeight: null,
        brandKitOverlays: null,
      },
      {
        id: "shot_3",
        templateId: "template_1",
        index: 2,
        timeRange: "20-30",
        duration: 10,
        description: "Closing shot",
        prompt: "Sunset over landscape",
        negativePrompt: "blurry",
        camera: "cinematic",
        lighting: "golden hour",
        generationType: "TEXT_TO_VIDEO",
        resolution: "1080p",
        fps: 24,
        cameraMotion: "orbit",
        motionStrength: 0.7,
        seed: 44,
        referenceImageUrl: null,
        referenceRole: null,
        referenceWeight: null,
        brandKitOverlays: null,
      },
    ],
    ...overrides,
  };
}

// Helper: Create mock brand kit
function createMockBrandKit(overrides: any = {}) {
  return {
    id: "brandkit_1",
    userId: "user_1",
    name: "Test Brand",
    logoUrl: "https://example.com/logo.png",
    logoPosition: "bottom-right",
    logoOpacity: 0.9,
    colorPalette: ["#FF0000", "#00FF00"],
    primaryFont: "Arial",
    secondaryFont: "Roboto",
    ...overrides,
  };
}

// Helper: Create mock job
function createMockJob(overrides: any = {}) {
  return {
    id: "job_1",
    userId: "user_1",
    templateId: "template_1",
    brandKitId: null,
    status: "QUEUED",
    progress: 0,
    currentShot: 0,
    totalShots: 3,
    customizations: null,
    shotResults: null,
    stitchedVideoUrl: null,
    error: null,
    creditsUsed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

describe("TemplateOrchestrator", () => {
  let orchestrator: TemplateOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockPrisma.storyboardTemplate.findUnique.mockResolvedValue(
      createMockTemplate(),
    );
    mockPrisma.brandKit.findUnique.mockResolvedValue(null);
    mockPrisma.templateGenerationJob.create.mockResolvedValue(createMockJob());
    mockPrisma.templateGenerationJob.update.mockResolvedValue(
      createMockJob({ status: "COMPLETED" }),
    );

    mockProviderRouter.generate.mockResolvedValue({
      id: "provider_job_1",
      status: "processing",
      metadata: { provider: "seedance" },
    });

    mockProviderRouter.waitForCompletion.mockResolvedValue({
      id: "provider_job_1",
      status: "completed",
      resultUrl: "https://cdn.example.com/shot.mp4",
    });

    mockStorage.upload.mockResolvedValue({
      url: "https://cdn.example.com/stitched.mp4",
    });

    orchestrator = new TemplateOrchestrator(mockStorage as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("prismaToPipelineType helper", () => {
    it("converts TEXT_TO_VIDEO to text-to-video", () => {
      // prismaToPipelineType is a private function, test via prepareShotTasks
      const template = createMockTemplate();
      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        undefined,
        null,
      );
      expect(shotTasks[0].generationType).toBe("text-to-video");
    });

    it("converts generation type correctly in shot tasks", () => {
      const template = createMockTemplate({
        shots: [
          {
            ...createMockTemplate().shots[0],
            generationType: "IMAGE_TO_VIDEO",
          },
        ],
      });
      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        undefined,
        null,
      );
      expect(shotTasks[0].generationType).toBe("image-to-video");
    });

    it("handles VIDEO_TO_VIDEO generation type", () => {
      const template = createMockTemplate({
        shots: [
          {
            ...createMockTemplate().shots[0],
            generationType: "VIDEO_TO_VIDEO",
          },
        ],
      });
      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        undefined,
        null,
      );
      expect(shotTasks[0].generationType).toBe("video-to-video");
    });
  });

  describe("loadTemplate", () => {
    it("loads template with shots from database", async () => {
      const template = createMockTemplate();
      mockPrisma.storyboardTemplate.findUnique.mockResolvedValue(template);

      // Access private method via any
      const loadedTemplate = await (orchestrator as any).loadTemplate(
        "template_1",
      );

      expect(mockPrisma.storyboardTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: "template_1" },
        include: { shots: { orderBy: { index: "asc" } } },
      });
      expect(loadedTemplate).toEqual(template);
    });

    it("returns null for non-existent template", async () => {
      mockPrisma.storyboardTemplate.findUnique.mockResolvedValue(null);

      const loadedTemplate = await (orchestrator as any).loadTemplate(
        "non_existent",
      );

      expect(loadedTemplate).toBeNull();
    });
  });

  describe("loadBrandKit", () => {
    it("loads brand kit from database", async () => {
      const brandKit = createMockBrandKit();
      mockPrisma.brandKit.findUnique.mockResolvedValue(brandKit);

      const loadedBrandKit = await (orchestrator as any).loadBrandKit(
        "brandkit_1",
        "user_1",
      );

      expect(mockPrisma.brandKit.findUnique).toHaveBeenCalledWith({
        where: { id: "brandkit_1", userId: "user_1" },
      });
      expect(loadedBrandKit).toEqual(brandKit);
    });

    it("returns null for non-existent brand kit", async () => {
      mockPrisma.brandKit.findUnique.mockResolvedValue(null);

      const loadedBrandKit = await (orchestrator as any).loadBrandKit(
        "non_existent",
        "user_1",
      );

      expect(loadedBrandKit).toBeNull();
    });
  });

  describe("prepareShotTasks", () => {
    it("creates shot tasks from template shots", () => {
      const template = createMockTemplate();

      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        undefined,
        null,
      );

      expect(shotTasks).toHaveLength(3);
      expect(shotTasks[0].shotIndex).toBe(0);
      expect(shotTasks[0].prompt).toBe("Beautiful sunrise over the city");
      expect(shotTasks[0].generationType).toBe("text-to-video");
      expect(shotTasks[0].params).toBeDefined();
    });

    it("applies shot overrides from customizations", () => {
      const template = createMockTemplate();
      const customizations = {
        shotOverrides: {
          0: {
            prompt: "Modified opening prompt",
            camera: "zoom",
          },
        },
      };

      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        customizations,
        null,
      );

      expect(shotTasks[0].prompt).toBe("Modified opening prompt");
    });

    it("injects brand kit text placeholders", () => {
      const template = createMockTemplate({
        shots: [
          {
            ...createMockTemplate().shots[0],
            prompt: "Welcome to {brand_name} - Your trusted partner",
          },
        ],
      });
      const brandKit = createMockBrandKit();
      const customizations = {
        brandKitOverrides: {
          textValues: {
            brand_name: "Acme Corp",
          },
        },
      };

      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        customizations,
        brandKit,
      );

      expect(shotTasks[0].prompt).toBe(
        "Welcome to Acme Corp - Your trusted partner",
      );
    });

    it("applies reference style from customizations", () => {
      const template = createMockTemplate();
      const customizations = {
        referenceStyleUrl: "https://example.com/style.jpg",
      };

      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        customizations,
        null,
      );

      expect(shotTasks[0].referenceImages).toBeDefined();
      expect(shotTasks[0].referenceImages).toContainEqual(
        expect.objectContaining({
          url: "https://example.com/style.jpg",
          role: "style",
          weight: 0.8,
        }),
      );
    });

    it("builds camera control config for each shot", () => {
      const template = createMockTemplate();

      const shotTasks = (orchestrator as any).prepareShotTasks(
        template,
        undefined,
        null,
      );

      expect(shotTasks[0].cameraControl).toBeDefined();
      expect(shotTasks[0].cameraControl.keyframes).toBeDefined();
    });
  });

  describe("buildCameraControl", () => {
    it("returns keyframes for 'pan' camera motion", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "pan";

      const cameraControl = (orchestrator as any).buildCameraControl(
        shot,
        undefined,
      );

      expect(cameraControl.keyframes).toHaveLength(2);
      expect(cameraControl.interpolation).toBe("smooth");
    });

    it("returns single keyframe for 'static' camera motion", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "static";

      const cameraControl = (orchestrator as any).buildCameraControl(
        shot,
        undefined,
      );

      expect(cameraControl.keyframes).toHaveLength(1);
    });

    it("returns keyframes for 'orbit' camera motion", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "orbit";

      const cameraControl = (orchestrator as any).buildCameraControl(
        shot,
        undefined,
      );

      expect(cameraControl.keyframes).toHaveLength(2);
      expect(cameraControl.keyframes[0].position).toBeDefined();
      expect(cameraControl.keyframes[0].target).toBeDefined();
    });

    it("returns keyframes for 'handheld' camera motion with shake", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "handheld";

      const cameraControl = (orchestrator as any).buildCameraControl(
        shot,
        undefined,
      );

      expect(cameraControl.keyframes).toHaveLength(5);
    });

    it("uses override camera if provided", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "static";
      const override = { camera: "zoom" };

      const cameraControl = (orchestrator as any).buildCameraControl(
        shot,
        override,
      );

      expect(cameraControl.keyframes).toHaveLength(2); // zoom has 2 keyframes
    });
  });

  describe("buildShotParams", () => {
    it("builds TEXT_TO_VIDEO params correctly", () => {
      const shot = createMockTemplate().shots[0];
      shot.generationType = "TEXT_TO_VIDEO";

      const params = (orchestrator as any).buildShotParams(
        shot,
        undefined,
        null,
        undefined,
        "9:16",
      );

      expect(params.duration).toBe(10);
      expect(params.aspectRatio).toBe("9:16");
      expect(params.resolution).toBe("1080p");
      expect(params.fps).toBe(24);
      expect(params.cameraMotion).toBe("pan");
    });

    it("builds IMAGE_TO_VIDEO params with motion strength", () => {
      const shot = createMockTemplate().shots[0];
      shot.generationType = "IMAGE_TO_VIDEO";

      const params = (orchestrator as any).buildShotParams(
        shot,
        undefined,
        null,
        undefined,
        "16:9",
      );

      expect(params.motionStrength).toBe(0.5);
    });

    it("builds VIDEO_TO_VIDEO params with style", () => {
      const shot = createMockTemplate().shots[0];
      shot.generationType = "VIDEO_TO_VIDEO";

      const params = (orchestrator as any).buildShotParams(
        shot,
        undefined,
        null,
        undefined,
        "1:1",
      );

      expect(params.style).toBeDefined();
      expect(params.strength).toBe(0.7);
      expect(params.preserveStructure).toBe(true);
    });

    it("applies shot override camera motion", () => {
      const shot = createMockTemplate().shots[0];
      shot.cameraMotion = "pan";
      const override = { camera: "orbit" };

      const params = (orchestrator as any).buildShotParams(
        shot,
        override,
        null,
        undefined,
        "9:16",
      );

      expect(params.cameraMotion).toBe("orbit");
    });
  });

  describe("createJobRecord", () => {
    it("creates a template generation job record", async () => {
      const job = createMockJob();
      mockPrisma.templateGenerationJob.create.mockResolvedValue(job);

      const createdJob = await (orchestrator as any).createJobRecord(
        "template_1",
        "user_1",
        undefined,
        3,
        undefined,
      );

      expect(mockPrisma.templateGenerationJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_1",
          templateId: "template_1",
          totalShots: 3,
          status: "QUEUED",
          progress: 0,
          currentShot: 0,
          creditsUsed: 0,
        }),
      });
      expect(createdJob).toEqual(job);
    });
  });

  describe("updateJobStatus", () => {
    it("updates job status and progress", async () => {
      mockPrisma.templateGenerationJob.update.mockResolvedValue(
        createMockJob({ status: "GENERATING_SHOTS" }),
      );

      await (orchestrator as any).updateJobStatus(
        "job_1",
        "GENERATING_SHOTS",
        50,
        1,
      );

      expect(mockPrisma.templateGenerationJob.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: {
          status: "GENERATING_SHOTS",
          progress: 50,
          currentShot: 1,
          updatedAt: expect.any(Date),
        },
      });
    });

    it("updates without currentShot when not provided", async () => {
      mockPrisma.templateGenerationJob.update.mockResolvedValue(
        createMockJob(),
      );

      await (orchestrator as any).updateJobStatus("job_1", "PREPARING", 5);

      expect(mockPrisma.templateGenerationJob.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: {
          status: "PREPARING",
          progress: 5,
          currentShot: undefined,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe("finalizeJob", () => {
    it("finalizes with COMPLETED status when all shots succeed", async () => {
      mockPrisma.templateGenerationJob.update.mockResolvedValue(
        createMockJob({
          status: "COMPLETED",
          stitchedVideoUrl: "https://cdn.example.com/stitched.mp4",
        }),
      );

      const shotResults = [
        { shotIndex: 0, success: true, url: "url1" },
        { shotIndex: 1, success: true, url: "url2" },
        { shotIndex: 2, success: true, url: "url3" },
      ];

      await (orchestrator as any).finalizeJob(
        "job_1",
        "COMPLETED",
        shotResults,
        "https://cdn.example.com/stitched.mp4",
      );

      expect(mockPrisma.templateGenerationJob.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: expect.objectContaining({
          status: "COMPLETED",
          progress: 100,
          stitchedVideoUrl: "https://cdn.example.com/stitched.mp4",
          creditsUsed: 3,
          completedAt: expect.any(Date),
        }),
      });
    });

    it("finalizes with PARTIAL_SUCCESS when some shots fail", async () => {
      mockPrisma.templateGenerationJob.update.mockResolvedValue(
        createMockJob({ status: "PARTIAL_SUCCESS" }),
      );

      const shotResults = [
        { shotIndex: 0, success: true, url: "url1" },
        { shotIndex: 1, success: false, error: "failed" },
        { shotIndex: 2, success: true, url: "url3" },
      ];

      await (orchestrator as any).finalizeJob(
        "job_1",
        "PARTIAL_SUCCESS",
        shotResults,
        "https://cdn.example.com/stitched.mp4",
      );

      expect(mockPrisma.templateGenerationJob.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: expect.objectContaining({
          status: "PARTIAL_SUCCESS",
          creditsUsed: 2,
        }),
      });
    });

    it("finalizes with FAILED status when all shots fail", async () => {
      mockPrisma.templateGenerationJob.update.mockResolvedValue(
        createMockJob({ status: "FAILED", error: "All shots failed" }),
      );

      const shotResults = [
        { shotIndex: 0, success: false, error: "failed" },
        { shotIndex: 1, success: false, error: "failed" },
        { shotIndex: 2, success: false, error: "failed" },
      ];

      await (orchestrator as any).finalizeJob(
        "job_1",
        "FAILED",
        shotResults,
        undefined,
        "All shots failed",
      );

      expect(mockPrisma.templateGenerationJob.update).toHaveBeenCalledWith({
        where: { id: "job_1" },
        data: expect.objectContaining({
          status: "FAILED",
          error: "All shots failed",
          creditsUsed: 0,
        }),
      });
    });
  });

  describe("error handling", () => {
    it("throws error when template not found", async () => {
      mockPrisma.storyboardTemplate.findUnique.mockResolvedValue(null);

      const input: TemplateGenerationInput = {
        templateId: "non_existent",
        userId: "user_1",
      };

      await expect(orchestrator.generateFromTemplate(input)).rejects.toThrow(
        "Template not found: non_existent",
      );
    });
  });

  describe("file operations stubs", () => {
    it("downloadToTempFile method exists", () => {
      expect(typeof (orchestrator as any).downloadToTempFile).toBe("function");
    });

    it("cleanupTempFiles method exists", () => {
      expect(typeof (orchestrator as any).cleanupTempFiles).toBe("function");
    });

    it("readFile method exists", () => {
      expect(typeof (orchestrator as any).readFile).toBe("function");
    });

    it("stitchShots method exists", () => {
      expect(typeof (orchestrator as any).stitchShots).toBe("function");
    });
  });
});
