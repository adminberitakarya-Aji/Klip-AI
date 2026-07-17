import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { generationRequestSchema } from '@klipai/core/schemas';
import { prisma } from '@klipai/db/client';
import { GenerationType } from '@klipai/core/types';

type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const VALID_TYPES: GenerationType[] = [
  GenerationType.TEXT_TO_VIDEO,
  GenerationType.IMAGE_TO_VIDEO,
  GenerationType.VIDEO_TO_VIDEO,
  GenerationType.TEXT_TO_IMAGE,
  GenerationType.IMAGE_TO_IMAGE,
  GenerationType.MOTION_CONTROL,
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  
  if (!VALID_TYPES.includes(type as GenerationType)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid generation type' } },
      { status: 400 }
    );
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      );
    }

    // Atomic credit check and decrement using a transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Check and decrement credits atomically
      const updatedUser = await tx.user.update({
        where: { id: session.user.id, credits: { gt: 0 } },
        data: { credits: { decrement: 1 } },
        select: { credits: true },
      });

      if (!updatedUser) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Create generation record
      const generation = await tx.generation.create({
        data: {
          userId: session.user.id,
          prompt: parsed.data.prompt,
          type: (type as GenerationType).toUpperCase().replace(/-/g, '_') as any,
          status: 'QUEUED',
          options: parsed.data.options as any,
          images: parsed.data.images || [],
          video: parsed.data.video || null,
        },
      });

      return { generationId: generation.id, credits: updatedUser.credits };
    });

    // Queue for async processing using the public createGeneration method
    await generationService.createGeneration(session.user.id, {
      ...parsed.data,
      type: type as GenerationType,
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: result.generationId, 
        status: 'QUEUED', 
        progress: 0, 
        createdAt: Date.now() 
      } 
    });
  } catch (error) {
    console.error(`${type} error:`, error);
    
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Generation failed' } },
      { status: 500 }
    );
  }
}
