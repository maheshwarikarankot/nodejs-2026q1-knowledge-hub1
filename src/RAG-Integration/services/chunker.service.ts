import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkerService {
  private readonly chunkSize: number;
  private readonly overlap: number;

  constructor() {
    this.chunkSize = parseInt(process.env.RAG_CHUNK_SIZE ?? '800', 10);
    this.overlap = parseInt(process.env.RAG_CHUNK_OVERLAP ?? '200', 10);
  }

  chunk(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    // Guard: overlap must be less than chunkSize to guarantee forward progress
    const step = Math.max(1, this.chunkSize - this.overlap);
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      const slice = text.slice(start, end).trim();
      if (slice.length > 0) chunks.push(slice);
      if (end >= text.length) break;
      start += step;
    }

    return chunks;
  }
}
