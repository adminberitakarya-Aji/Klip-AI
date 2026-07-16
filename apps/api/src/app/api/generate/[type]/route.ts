import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { generationRequestSchema } from '@klipai/core/schemas';
import { prisma } from '@klipai/db/client';
import { GenerationType } from '@klipai/core/types';

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
    const session = await getServerSession(authOptions);
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

    // Check user credits
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.credits <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } },
        { status: 402 }
      );
    }

    const result = await generationService.createGeneration(session.user.id, {
      ...parsed.data,
      type: type as GenerationType,
    });

    // Deduct credit
    await prisma.user.update({ 
      where: { id: session.user.id }, 
      data: { credits: { decrement: 1 } } 
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`${type} error:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Generation failed' } },
      { status: 500 }
    );
  }
}