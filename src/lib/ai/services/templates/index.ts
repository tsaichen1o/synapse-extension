import { ContentType } from '../../../types';

/**
 * Field template definition for structured data extraction
 */
export interface FieldTemplate {
    /** Unique key for this field */
    key: string;
    /** Human-readable description */
    description: string;
    /** Data type */
    type: 'string' | 'array' | 'object';
    /** Priority level */
    priority: 'required' | 'optional';
    /** Example values (for prompt guidance) */
    examples?: string[];
}

/**
 * Content template for specific content types
 */
export interface ContentTemplate {
    /** Template name */
    name: string;
    /** Template description */
    description: string;
    /** Fields to extract */
    fields: FieldTemplate[];
    /** Summary writing guidelines */
    summaryGuidelines: string;
    /** Additional prompt hints for this content type */
    extractionHints?: string;
}

/**
 * Content-type-specific templates for structured data extraction
 */
export const CONTENT_TEMPLATES: Record<ContentType, ContentTemplate> = {
    'research-paper': {
        name: 'Research Paper',
        description: 'Academic research publication',
        fields: [
            {
                key: 'authors',
                description: 'Paper authors',
                type: 'array',
                priority: 'required',
                examples: ['Jane Smith', 'John Doe']
            },
            {
                key: 'publication_venue',
                description: 'Conference/journal name',
                type: 'string',
                priority: 'optional',
                examples: ['NeurIPS 2024', 'Nature', 'arXiv']
            },
            {
                key: 'publication_year',
                description: 'Year of publication',
                type: 'string',
                priority: 'optional',
                examples: ['2024', '2023']
            },
            {
                key: 'research_question',
                description: 'Main research question or problem addressed',
                type: 'string',
                priority: 'required'
            },
            {
                key: 'methodology',
                description: 'Research methods and approaches used',
                type: 'array',
                priority: 'required',
                examples: ['Transformer architecture', 'Supervised learning', 'A/B testing']
            },
            {
                key: 'key_contributions',
                description: 'Main contributions and novel findings',
                type: 'array',
                priority: 'required',
                examples: ['Improved accuracy by 15%', 'Novel attention mechanism']
            },
            {
                key: 'datasets_used',
                description: 'Datasets mentioned or used',
                type: 'array',
                priority: 'optional',
                examples: ['ImageNet', 'COCO', 'WMT14']
            },
            {
                key: 'evaluation_metrics',
                description: 'Metrics used for evaluation',
                type: 'array',
                priority: 'optional',
                examples: ['Accuracy', 'F1-score', 'BLEU']
            },
            {
                key: 'baselines_compared',
                description: 'Baseline methods compared against',
                type: 'array',
                priority: 'optional',
                examples: ['BERT', 'ResNet-50', 'Previous SOTA']
            },
            {
                key: 'key_results',
                description: 'Quantitative results and performance numbers',
                type: 'array',
                priority: 'optional',
                examples: ['95.2% accuracy', '10x faster than baseline']
            },
            {
                key: 'limitations',
                description: 'Acknowledged limitations of the work',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'future_work',
                description: 'Suggested future research directions',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'technologies_used',
                description: 'Tools, frameworks, libraries used',
                type: 'array',
                priority: 'optional',
                examples: ['PyTorch', 'TensorFlow', 'CUDA']
            }
        ],
        summaryGuidelines: 'Focus on: (1) research gap and motivation, (2) proposed methodology and approach, (3) key contributions and novelty, (4) quantitative results with metrics, (5) implications and significance',
        extractionHints: 'Distinguish between background/related work vs. the paper\'s own contributions. Pay special attention to the Abstract, Introduction, and Conclusion sections for key information.'
    },

    'article': {
        name: 'Article/Blog Post',
        description: 'News article, blog post, or online content',
        fields: [
            {
                key: 'authors',
                description: 'Article authors or contributors',
                type: 'array',
                priority: 'optional',
                examples: ['Sarah Johnson', 'Tech Blogger']
            },
            {
                key: 'publication_date',
                description: 'Publication or last updated date',
                type: 'string',
                priority: 'optional'
            },
            {
                key: 'publication',
                description: 'Publication name or website',
                type: 'string',
                priority: 'optional',
                examples: ['TechCrunch', 'Medium', 'The Verge']
            },
            {
                key: 'main_topics',
                description: 'Main topics or themes discussed',
                type: 'array',
                priority: 'required',
                examples: ['AI ethics', 'Climate change', 'Web development']
            },
            {
                key: 'key_points',
                description: 'Main arguments, points, or takeaways',
                type: 'array',
                priority: 'required'
            },
            {
                key: 'mentioned_people',
                description: 'Important people mentioned',
                type: 'array',
                priority: 'optional',
                examples: ['Elon Musk', 'Dr. Jane Smith']
            },
            {
                key: 'mentioned_companies',
                description: 'Companies or organizations mentioned',
                type: 'array',
                priority: 'optional',
                examples: ['Google', 'OpenAI', 'Microsoft']
            },
            {
                key: 'mentioned_products',
                description: 'Products or services mentioned',
                type: 'array',
                priority: 'optional',
                examples: ['ChatGPT', 'iPhone 15', 'AWS']
            },
            {
                key: 'sources_cited',
                description: 'External sources or references cited',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'statistics',
                description: 'Important numbers, statistics, or data points',
                type: 'array',
                priority: 'optional',
                examples: ['50% increase in users', '$1B funding']
            },
            {
                key: 'quotes',
                description: 'Notable quotes from the article',
                type: 'array',
                priority: 'optional'
            }
        ],
        summaryGuidelines: 'Focus on: (1) main message or thesis, (2) key supporting points and evidence, (3) context and significance, (4) actionable takeaways if applicable',
        extractionHints: 'Pay attention to quotes, statistics, and expert opinions. Identify the author\'s perspective or bias if evident.'
    },

    'documentation': {
        name: 'Technical Documentation',
        description: 'Technical documentation, API docs, or developer guides',
        fields: [
            {
                key: 'technology_name',
                description: 'Main technology, library, or framework',
                type: 'string',
                priority: 'required',
                examples: ['React', 'TensorFlow', 'REST API']
            },
            {
                key: 'version',
                description: 'Version or release number',
                type: 'string',
                priority: 'optional',
                examples: ['v18.2', '2.0', 'latest']
            },
            {
                key: 'purpose',
                description: 'What this technology is for',
                type: 'string',
                priority: 'required'
            },
            {
                key: 'core_concepts',
                description: 'Main concepts or features explained',
                type: 'array',
                priority: 'required',
                examples: ['Components', 'Hooks', 'State management']
            },
            {
                key: 'apis_functions',
                description: 'Key APIs, functions, or methods documented',
                type: 'array',
                priority: 'optional',
                examples: ['useState()', 'fetch()', 'map()']
            },
            {
                key: 'usage_examples',
                description: 'Example use cases or scenarios',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'prerequisites',
                description: 'Required knowledge or dependencies',
                type: 'array',
                priority: 'optional',
                examples: ['Node.js installed', 'Basic JavaScript knowledge']
            },
            {
                key: 'installation_steps',
                description: 'Installation or setup instructions',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'configuration_options',
                description: 'Configuration parameters or options',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'common_issues',
                description: 'Common problems and solutions',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'related_technologies',
                description: 'Related tools or frameworks',
                type: 'array',
                priority: 'optional'
            }
        ],
        summaryGuidelines: 'Focus on: (1) what the technology does and why use it, (2) main concepts and features, (3) how to get started, (4) common use cases',
        extractionHints: 'Look for code examples, API signatures, and configuration details. Identify whether it\'s a getting started guide, API reference, or tutorial.'
    },

    'blog': {
        name: 'Blog Post',
        description: 'Personal blog post or opinion piece',
        fields: [
            {
                key: 'author',
                description: 'Blog author name',
                type: 'string',
                priority: 'optional'
            },
            {
                key: 'publication_date',
                description: 'Publication date',
                type: 'string',
                priority: 'optional'
            },
            {
                key: 'main_topic',
                description: 'Primary topic or theme',
                type: 'string',
                priority: 'required'
            },
            {
                key: 'key_insights',
                description: 'Main insights or lessons',
                type: 'array',
                priority: 'required'
            },
            {
                key: 'personal_experiences',
                description: 'Personal stories or experiences shared',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'recommendations',
                description: 'Advice or recommendations',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'resources_mentioned',
                description: 'Books, articles, tools, or resources mentioned',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'technologies_discussed',
                description: 'Technologies or tools discussed',
                type: 'array',
                priority: 'optional'
            }
        ],
        summaryGuidelines: 'Focus on: (1) main theme or message, (2) key insights and lessons, (3) actionable advice, (4) personal perspective',
        extractionHints: 'Look for personal opinions, experiences, and practical advice. Identify the author\'s unique perspective.'
    },

    'wiki': {
        name: 'Wiki/Encyclopedia',
        description: 'Wikipedia-style encyclopedia content',
        fields: [
            {
                key: 'subject',
                description: 'Main subject or entity',
                type: 'string',
                priority: 'required'
            },
            {
                key: 'category',
                description: 'Category or domain',
                type: 'string',
                priority: 'optional',
                examples: ['Technology', 'History', 'Science']
            },
            {
                key: 'definition',
                description: 'Brief definition or description',
                type: 'string',
                priority: 'required'
            },
            {
                key: 'key_facts',
                description: 'Important facts or characteristics',
                type: 'array',
                priority: 'required'
            },
            {
                key: 'historical_context',
                description: 'Historical background or timeline',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'notable_people',
                description: 'Important people related to this topic',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'related_concepts',
                description: 'Related topics or concepts',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'applications_uses',
                description: 'Practical applications or uses',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'references',
                description: 'External references or citations',
                type: 'array',
                priority: 'optional'
            }
        ],
        summaryGuidelines: 'Focus on: (1) clear definition, (2) key characteristics and facts, (3) historical context, (4) significance and applications',
        extractionHints: 'Extract factual, objective information. Look for dates, names, and verifiable facts.'
    },

    'generic': {
        name: 'Generic Web Content',
        description: 'General web page content',
        fields: [
            {
                key: 'main_topics',
                description: 'Main topics or themes',
                type: 'array',
                priority: 'required'
            },
            {
                key: 'key_points',
                description: 'Important points or information',
                type: 'array',
                priority: 'required'
            },
            {
                key: 'entities_mentioned',
                description: 'People, organizations, or products mentioned',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'technologies',
                description: 'Technologies or tools mentioned',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'links_references',
                description: 'Important external links or references',
                type: 'array',
                priority: 'optional'
            },
            {
                key: 'actionable_items',
                description: 'Action items or next steps',
                type: 'array',
                priority: 'optional'
            }
        ],
        summaryGuidelines: 'Focus on: (1) main purpose or message, (2) key information, (3) important details',
        extractionHints: 'Extract the most relevant and useful information based on the content\'s apparent purpose.'
    }
};

/**
 * Get template for a specific content type
 */
export function getTemplate(contentType: ContentType): ContentTemplate {
    return CONTENT_TEMPLATES[contentType] || CONTENT_TEMPLATES['generic'];
}

/**
 * Generate JSON schema for a template's fields
 */
export function generateSchemaFromTemplate(template: ContentTemplate): object {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const field of template.fields) {
        if (field.type === 'array') {
            properties[field.key] = {
                type: 'array',
                items: { type: 'string' },
                description: field.description
            };
        } else if (field.type === 'object') {
            properties[field.key] = {
                type: 'object',
                description: field.description,
                additionalProperties: true
            };
        } else {
            properties[field.key] = {
                type: 'string',
                description: field.description
            };
        }

        if (field.priority === 'required') {
            required.push(field.key);
        }
    }

    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false
    };
}

/**
 * Generate prompt section describing template fields
 */
export function generateFieldsPromptSection(template: ContentTemplate): string {
    const requiredFields = template.fields.filter(f => f.priority === 'required');
    const optionalFields = template.fields.filter(f => f.priority === 'optional');

    let prompt = '## Required Fields:\n';
    for (const field of requiredFields) {
        prompt += `- **${field.key}**: ${field.description}`;
        if (field.examples && field.examples.length > 0) {
            prompt += ` (e.g., ${field.examples.join(', ')})`;
        }
        prompt += '\n';
    }

    if (optionalFields.length > 0) {
        prompt += '\n## Optional Fields (include if found):\n';
        for (const field of optionalFields) {
            prompt += `- **${field.key}**: ${field.description}`;
            if (field.examples && field.examples.length > 0) {
                prompt += ` (e.g., ${field.examples.join(', ')})`;
            }
            prompt += '\n';
        }
    }

    return prompt;
}
