import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generationService } from '@klipai/ai/services/generation-service';
import { prisma } from '@klipai/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await auth();
    if (!session || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const generation = await prisma.generation.findUnique({ where: { id } });
    if (!generation || generation.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Generation not found' } },
        { status: 404 }
      );
    }

    const status = await generationService.checkStatus(id);
    
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check status' } },
      { status: 500 }
    );
  }
}
