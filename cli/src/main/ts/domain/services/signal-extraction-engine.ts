
import type { SignalMatch, GitDiffChunk, SignalCategory } from '../models/audit-inference.js';

export interface SignalDefinition {
  signal: string;
  regex: RegExp;
  category: SignalCategory;
  confidence?: number;
}

const DEFAULT_SIGNALS: SignalDefinition[] = [
  // --- Database ---
  {
    signal: "prisma",
    regex: /@prisma\/client|prisma\./i,
    category: "database",
    confidence: 0.9,
  },
  {
    signal: "drizzle",
    regex: /drizzle-orm/i,
    category: "database",
    confidence: 0.9,
  },
  {
    signal: "sqlalchemy",
    regex: /sqlalchemy/i,
    category: "database",
    confidence: 0.9,
  },
  {
    signal: "hibernate",
    regex: /org\.hibernate|hibernate\./i,
    category: "database",
    confidence: 0.9,
  },
  {
    signal: "raw-sql",
    regex: /\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|DROP TABLE)\b/i,
    category: "database",
    confidence: 0.6,
  },

  // --- Network ---
  {
    signal: "axios",
    regex: /axios\./i,
    category: "network",
    confidence: 0.9,
  },
  {
    signal: "fetch",
    regex: /\bfetch\(/i,
    category: "network",
    confidence: 0.8,
  },
  {
    signal: "requests",
    regex: /\brequests\.(get|post|put|delete)\(/i,
    category: "network",
    confidence: 0.9,
  },
  {
    signal: "spring-rest",
    regex: /RestTemplate|WebClient/i,
    category: "network",
    confidence: 0.8,
  },
  {
    signal: "go-http",
    regex: /"net\/http"/i,
    category: "network",
    confidence: 0.8,
  },

  // --- Logging ---
  {
    signal: "console-log",
    regex: /console\.log/i,
    category: "logging",
    confidence: 0.6,
  },
  {
    signal: "pino",
    regex: /pino\(/i,
    category: "logging",
    confidence: 0.9,
  },
  {
    signal: "winston",
    regex: /winston\./i,
    category: "logging",
    confidence: 0.9,
  },
  {
    signal: "slf4j",
    regex: /org\.slf4j\.Logger|LoggerFactory/i,
    category: "logging",
    confidence: 0.9,
  },
  {
    signal: "python-logging",
    regex: /logging\.(getLogger|info|error|debug|warn)/i,
    category: "logging",
    confidence: 0.8,
  },

  // --- Auth ---
  {
    signal: "jwt",
    regex: /jsonwebtoken|jwt\.|PyJWT|io\.jsonwebtoken/i,
    category: "auth",
    confidence: 0.8,
  },
  {
    signal: "passport",
    regex: /passport\./i,
    category: "auth",
    confidence: 0.9,
  },
  {
    signal: "spring-security",
    regex: /org\.springframework\.security/i,
    category: "auth",
    confidence: 0.9,
  },

  // --- Config ---
  {
    signal: "dotenv",
    regex: /dotenv|process\.env|os\.environ/i,
    category: "config",
    confidence: 0.7,
  },
  {
    signal: "spring-boot-config",
    regex: /@Value\(|@ConfigurationProperties/i,
    category: "config",
    confidence: 0.9,
  },

  // --- Queue ---
  {
    signal: "rabbitmq",
    regex: /amqplib|rabbit/i,
    category: "queue",
    confidence: 0.9,
  },
  {
    signal: "kafka",
    regex: /kafkajs|kafka-python|confluent-kafka/i,
    category: "queue",
    confidence: 0.9,
  },
  {
    signal: "bullmq",
    regex: /bullmq|bull\./i,
    category: "queue",
    confidence: 0.9,
  },
  {
    signal: "aws-sqs",
    regex: /@aws-sdk\/client-sqs|boto3\.client\('sqs'\)/i,
    category: "queue",
    confidence: 0.9,
  },

  // --- Storage ---
  {
    signal: "aws-s3",
    regex: /@aws-sdk\/client-s3|boto3\.client\('s3'\)/i,
    category: "storage",
    confidence: 0.9,
  },
  {
    signal: "google-cloud-storage",
    regex: /@google-cloud\/storage/i,
    category: "storage",
    confidence: 0.9,
  },
  {
    signal: "azure-storage",
    regex: /@azure\/storage-blob/i,
    category: "storage",
    confidence: 0.9,
  },
];

export const SIGNAL_ENGINE_VERSION = '1.2.1';

export class SignalExtractionEngine {
  private signals: SignalDefinition[];

  constructor(customSignals: SignalDefinition[] = []) {
    this.signals = [...DEFAULT_SIGNALS, ...customSignals];
  }

  extract(chunk: GitDiffChunk): SignalMatch[] {
    const matches: SignalMatch[] = [];

    // Analyze added lines for positive polarity
    for (const line of chunk.addedLines) {
      for (const def of this.signals) {
        if (def.regex.test(line)) {
          matches.push({
            signal: def.signal,
            category: def.category,
            confidence: def.confidence ?? 0.8,
            line: line.trim(),
            polarity: "positive",
            source: "regex",
          });
        }
      }
    }

    // Analyze removed lines for negative polarity
    for (const line of chunk.removedLines) {
      for (const def of this.signals) {
        if (def.regex.test(line)) {
          matches.push({
            signal: def.signal,
            category: def.category,
            confidence: def.confidence ?? 0.8,
            line: line.trim(),
            polarity: "negative",
            source: "regex",
          });
        }
      }
    }

    return matches;
  }
}
