import type { AIFeatureVector, AIRiskCategory } from '../types/ai';
import { featureVectorToArray } from './features';

export interface DecisionNode {
  isLeaf: boolean;
  prediction?: AIRiskCategory;
  probabilities?: Record<AIRiskCategory, number>;
  featureIndex?: number;
  splitThreshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
}

export class DecisionTree {
  private root: DecisionNode | null = null;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(maxDepth: number = 6, minSamplesSplit: number = 5) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  public train(X: number[][], y: AIRiskCategory[], maxFeatures?: number) {
    this.root = this.buildTree(X, y, 0, maxFeatures);
  }

  public predict(x: number[]): { prediction: AIRiskCategory; probabilities: Record<AIRiskCategory, number> } {
    let node = this.root;
    while (node && !node.isLeaf) {
      if (node.featureIndex === undefined || node.splitThreshold === undefined) break;
      if (x[node.featureIndex] <= node.splitThreshold) {
        node = node.left || null;
      } else {
        node = node.right || null;
      }
    }

    const defaultProbs: Record<AIRiskCategory, number> = {
      SAFE: 0,
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    if (node && node.prediction && node.probabilities) {
      return { prediction: node.prediction, probabilities: node.probabilities };
    }

    return { prediction: 'SAFE', probabilities: { ...defaultProbs, SAFE: 1 } };
  }

  private buildTree(
    X: number[][],
    y: AIRiskCategory[],
    depth: number,
    maxFeatures?: number
  ): DecisionNode {
    const classCounts = this.countClasses(y);
    const majorityClass = this.getMajorityClass(classCounts);
    const probabilities = this.getProbabilities(classCounts, y.length);

    // Stopping criteria: pure node, max depth reached, or too few samples
    if (
      Object.keys(classCounts).length === 1 ||
      depth >= this.maxDepth ||
      y.length < this.minSamplesSplit
    ) {
      return { isLeaf: true, prediction: majorityClass, probabilities };
    }

    const numFeatures = X[0]?.length || 0;
    let featureIndices = Array.from({ length: numFeatures }, (_, i) => i);

    if (maxFeatures && maxFeatures < numFeatures) {
      // Feature subsampling with high coverage
      featureIndices = featureIndices.sort(() => Math.random() - 0.5).slice(0, maxFeatures);
    }

    let bestGini = 1.0;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftX: number[][] = [];
    let bestLeftY: AIRiskCategory[] = [];
    let bestRightX: number[][] = [];
    let bestRightY: AIRiskCategory[] = [];

    const currentGini = this.calculateGini(classCounts, y.length);

    for (const featIdx of featureIndices) {
      const values = X.map((row) => row[featIdx]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
      if (uniqueValues.length < 2) continue;

      // Select up to 15 quantile thresholds
      const candidateThresholds: number[] = [];
      const step = Math.max(1, Math.floor(uniqueValues.length / 15));
      for (let i = 0; i < uniqueValues.length - 1; i += step) {
        candidateThresholds.push((uniqueValues[i] + uniqueValues[i + 1]) / 2);
      }

      for (const threshold of candidateThresholds) {
        const leftX: number[][] = [];
        const leftY: AIRiskCategory[] = [];
        const rightX: number[][] = [];
        const rightY: AIRiskCategory[] = [];

        for (let j = 0; j < X.length; j++) {
          if (X[j][featIdx] <= threshold) {
            leftX.push(X[j]);
            leftY.push(y[j]);
          } else {
            rightX.push(X[j]);
            rightY.push(y[j]);
          }
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const leftGini = this.calculateGini(this.countClasses(leftY), leftY.length);
        const rightGini = this.calculateGini(this.countClasses(rightY), rightY.length);
        const splitGini = (leftY.length / y.length) * leftGini + (rightY.length / y.length) * rightGini;

        if (splitGini < bestGini) {
          bestGini = splitGini;
          bestFeature = featIdx;
          bestThreshold = threshold;
          bestLeftX = leftX;
          bestLeftY = leftY;
          bestRightX = rightX;
          bestRightY = rightY;
        }
      }
    }

    // If no split improves impurity, return leaf node
    if (bestFeature === -1 || bestGini >= currentGini) {
      return { isLeaf: true, prediction: majorityClass, probabilities };
    }

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      splitThreshold: bestThreshold,
      left: this.buildTree(bestLeftX, bestLeftY, depth + 1, maxFeatures),
      right: this.buildTree(bestRightX, bestRightY, depth + 1, maxFeatures),
    };
  }

  private countClasses(y: AIRiskCategory[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const label of y) {
      counts[label] = (counts[label] || 0) + 1;
    }
    return counts;
  }

  private getMajorityClass(counts: Record<string, number>): AIRiskCategory {
    let maxClass: AIRiskCategory = 'SAFE';
    let maxCount = -1;
    for (const [cls, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxClass = cls as AIRiskCategory;
      }
    }
    return maxClass;
  }

  private getProbabilities(counts: Record<string, number>, total: number): Record<AIRiskCategory, number> {
    const categories: AIRiskCategory[] = ['SAFE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
    const probs: Record<AIRiskCategory, number> = {
      SAFE: 0,
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    for (const cat of categories) {
      probs[cat] = total > 0 ? (counts[cat] || 0) / total : 0;
    }
    return probs;
  }

  private calculateGini(counts: Record<string, number>, total: number): number {
    if (total === 0) return 0;
    let sumSquares = 0;
    for (const count of Object.values(counts)) {
      const p = count / total;
      sumSquares += p * p;
    }
    return 1 - sumSquares;
  }
}

export class RandomForestClassifier {
  private trees: DecisionTree[] = [];
  private numTrees: number;
  private maxDepth: number;

  constructor(numTrees: number = 10, maxDepth: number = 6) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
  }

  public train(X: number[][], y: AIRiskCategory[]) {
    this.trees = [];
    const nSamples = X.length;
    const maxFeatures = Math.max(6, Math.ceil((X[0]?.length || 1) * 0.75));

    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling with replacement
      const bootX: number[][] = [];
      const bootY: AIRiskCategory[] = [];
      for (let i = 0; i < nSamples; i++) {
        const idx = Math.floor(Math.random() * nSamples);
        bootX.push(X[idx]);
        bootY.push(y[idx]);
      }

      const tree = new DecisionTree(this.maxDepth);
      tree.train(bootX, bootY, maxFeatures);
      this.trees.push(tree);
    }
  }

  public predict(features: AIFeatureVector | number[]): {
    prediction: AIRiskCategory;
    probabilities: Record<AIRiskCategory, number>;
    confidence: number;
  } {
    const x = Array.isArray(features) ? features : featureVectorToArray(features);

    const aggregatedProbs: Record<AIRiskCategory, number> = {
      SAFE: 0,
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    if (this.trees.length === 0) {
      return { prediction: 'SAFE', probabilities: { ...aggregatedProbs, SAFE: 1 }, confidence: 1 };
    }

    for (const tree of this.trees) {
      const { probabilities } = tree.predict(x);
      for (const cat of Object.keys(aggregatedProbs) as AIRiskCategory[]) {
        aggregatedProbs[cat] += probabilities[cat] / this.trees.length;
      }
    }

    let topCategory: AIRiskCategory = 'SAFE';
    let topProb = -1;
    for (const [cat, prob] of Object.entries(aggregatedProbs)) {
      if (prob > topProb) {
        topProb = prob;
        topCategory = cat as AIRiskCategory;
      }
    }

    return {
      prediction: topCategory,
      probabilities: aggregatedProbs,
      confidence: Math.round(topProb * 100) / 100,
    };
  }
}
