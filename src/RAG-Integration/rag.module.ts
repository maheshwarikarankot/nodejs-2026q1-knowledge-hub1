import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './services/chunker.service';
import { ConversationService } from './services/conversation.service';
import { RagGenerationService } from './rag-generation.service';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [RagController],
  providers: [
    RagService,
    QdrantService,
    EmbeddingService,
    ChunkerService,
    ConversationService,
    RagGenerationService,
  ],
})
export class RagModule {}
