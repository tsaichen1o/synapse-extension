import { ContentType } from "../../../types";

/**
 * Field template definition for structured data extraction
 */
export interface FieldTemplate {
	/** Unique key for this field */
	key: string;
	/** Human-readable description */
	description: string;
	/** Data type */
	type: "string" | "array" | "object";
	/** Priority level */
	priority: "required" | "optional";
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
	"research-paper": {
		name: "Research Paper",
		description: "Academic research publication",
		fields: [
			{
				key: "authors",
				description: "Paper authors",
				type: "array",
				priority: "required",
				examples: ["Jane Smith", "John Doe"],
			},
			{
				key: "publication_venue",
				description: "Conference/journal name",
				type: "string",
				priority: "optional",
				examples: ["NeurIPS 2024", "Nature", "arXiv"],
			},
			{
				key: "publication_year",
				description: "Year of publication",
				type: "string",
				priority: "optional",
				examples: ["2024", "2023"],
			},
			{
				key: "research_question",
				description: "Main research question or problem addressed",
				type: "string",
				priority: "required",
			},
			{
				key: "methodology",
				description: "Research methods and approaches used",
				type: "array",
				priority: "required",
				examples: [
					"Transformer architecture",
					"Supervised learning",
					"A/B testing",
				],
			},
			{
				key: "key_contributions",
				description: "Main contributions and novel findings",
				type: "array",
				priority: "required",
				examples: [
					"Improved accuracy by 15%",
					"Novel attention mechanism",
				],
			},
			{
				key: "datasets_used",
				description: "Datasets mentioned or used",
				type: "array",
				priority: "optional",
				examples: ["ImageNet", "COCO", "WMT14"],
			},
			{
				key: "evaluation_metrics",
				description: "Metrics used for evaluation",
				type: "array",
				priority: "optional",
				examples: ["Accuracy", "F1-score", "BLEU"],
			},
			{
				key: "baselines_compared",
				description: "Baseline methods compared against",
				type: "array",
				priority: "optional",
				examples: ["BERT", "ResNet-50", "Previous SOTA"],
			},
			{
				key: "key_results",
				description: "Quantitative results and performance numbers",
				type: "array",
				priority: "optional",
				examples: ["95.2% accuracy", "10x faster than baseline"],
			},
			{
				key: "limitations",
				description: "Acknowledged limitations of the work",
				type: "array",
				priority: "optional",
			},
			{
				key: "future_work",
				description: "Suggested future research directions",
				type: "array",
				priority: "optional",
			},
			{
				key: "technologies_used",
				description: "Tools, frameworks, libraries used",
				type: "array",
				priority: "optional",
				examples: ["PyTorch", "TensorFlow", "CUDA"],
			},
		],
		summaryGuidelines:
			"Focus on: (1) research gap and motivation, (2) proposed methodology and approach, (3) key contributions and novelty, (4) quantitative results with metrics, (5) implications and significance",
		extractionHints:
			"Distinguish between background/related work vs. the paper's own contributions. Pay special attention to the Abstract, Introduction, and Conclusion sections for key information.",
	},

	article: {
		name: "Article/Blog Post",
		description: "News article, blog post, or online content",
		fields: [
			{
				key: "authors",
				description: "Article authors or contributors",
				type: "array",
				priority: "optional",
				examples: ["Sarah Johnson", "Tech Blogger"],
			},
			{
				key: "publication_date",
				description: "Publication or last updated date",
				type: "string",
				priority: "optional",
			},
			{
				key: "publication",
				description: "Publication name or website",
				type: "string",
				priority: "optional",
				examples: ["TechCrunch", "Medium", "The Verge"],
			},
			{
				key: "main_topics",
				description: "Main topics or themes discussed",
				type: "array",
				priority: "required",
				examples: ["AI ethics", "Climate change", "Web development"],
			},
			{
				key: "key_points",
				description: "Main arguments, points, or takeaways",
				type: "array",
				priority: "required",
			},
			{
				key: "mentioned_people",
				description: "Important people mentioned",
				type: "array",
				priority: "optional",
				examples: ["Elon Musk", "Dr. Jane Smith"],
			},
			{
				key: "mentioned_companies",
				description: "Companies or organizations mentioned",
				type: "array",
				priority: "optional",
				examples: ["Google", "OpenAI", "Microsoft"],
			},
			{
				key: "mentioned_products",
				description: "Products or services mentioned",
				type: "array",
				priority: "optional",
				examples: ["ChatGPT", "iPhone 15", "AWS"],
			},
			{
				key: "sources_cited",
				description: "External sources or references cited",
				type: "array",
				priority: "optional",
			},
			{
				key: "statistics",
				description: "Important numbers, statistics, or data points",
				type: "array",
				priority: "optional",
				examples: ["50% increase in users", "$1B funding"],
			},
			{
				key: "quotes",
				description: "Notable quotes from the article",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) main message or thesis, (2) key supporting points and evidence, (3) context and significance, (4) actionable takeaways if applicable",
		extractionHints:
			"Pay attention to quotes, statistics, and expert opinions. Identify the author's perspective or bias if evident.",
	},

	documentation: {
		name: "Technical Documentation",
		description: "Technical documentation, API docs, or developer guides",
		fields: [
			{
				key: "technology_name",
				description: "Main technology, library, or framework",
				type: "string",
				priority: "required",
				examples: ["React", "TensorFlow", "REST API"],
			},
			{
				key: "version",
				description: "Version or release number",
				type: "string",
				priority: "optional",
				examples: ["v18.2", "2.0", "latest"],
			},
			{
				key: "purpose",
				description: "What this technology is for",
				type: "string",
				priority: "required",
			},
			{
				key: "core_concepts",
				description: "Main concepts or features explained",
				type: "array",
				priority: "required",
				examples: ["Components", "Hooks", "State management"],
			},
			{
				key: "apis_functions",
				description: "Key APIs, functions, or methods documented",
				type: "array",
				priority: "optional",
				examples: ["useState()", "fetch()", "map()"],
			},
			{
				key: "usage_examples",
				description: "Example use cases or scenarios",
				type: "array",
				priority: "optional",
			},
			{
				key: "prerequisites",
				description: "Required knowledge or dependencies",
				type: "array",
				priority: "optional",
				examples: ["Node.js installed", "Basic JavaScript knowledge"],
			},
			{
				key: "installation_steps",
				description: "Installation or setup instructions",
				type: "array",
				priority: "optional",
			},
			{
				key: "configuration_options",
				description: "Configuration parameters or options",
				type: "array",
				priority: "optional",
			},
			{
				key: "common_issues",
				description: "Common problems and solutions",
				type: "array",
				priority: "optional",
			},
			{
				key: "related_technologies",
				description: "Related tools or frameworks",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) what the technology does and why use it, (2) main concepts and features, (3) how to get started, (4) common use cases",
		extractionHints:
			"Look for code examples, API signatures, and configuration details. Identify whether it's a getting started guide, API reference, or tutorial.",
	},

	blog: {
		name: "Blog Post",
		description: "Personal blog post or opinion piece",
		fields: [
			{
				key: "author",
				description: "Blog author name",
				type: "string",
				priority: "optional",
			},
			{
				key: "publication_date",
				description: "Publication date",
				type: "string",
				priority: "optional",
			},
			{
				key: "main_topic",
				description: "Primary topic or theme",
				type: "string",
				priority: "required",
			},
			{
				key: "key_insights",
				description: "Main insights or lessons",
				type: "array",
				priority: "required",
			},
			{
				key: "personal_experiences",
				description: "Personal stories or experiences shared",
				type: "array",
				priority: "optional",
			},
			{
				key: "recommendations",
				description: "Advice or recommendations",
				type: "array",
				priority: "optional",
			},
			{
				key: "resources_mentioned",
				description: "Books, articles, tools, or resources mentioned",
				type: "array",
				priority: "optional",
			},
			{
				key: "technologies_discussed",
				description: "Technologies or tools discussed",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) main theme or message, (2) key insights and lessons, (3) actionable advice, (4) personal perspective",
		extractionHints:
			"Look for personal opinions, experiences, and practical advice. Identify the author's unique perspective.",
	},

	wiki: {
		name: "Wiki/Encyclopedia",
		description: "Wikipedia-style encyclopedia content",
		fields: [
			{
				key: "subject",
				description: "Main subject or entity",
				type: "string",
				priority: "required",
			},
			{
				key: "category",
				description: "Category or domain",
				type: "string",
				priority: "optional",
				examples: ["Technology", "History", "Science"],
			},
			{
				key: "definition",
				description: "Brief definition or description",
				type: "string",
				priority: "required",
			},
			{
				key: "key_facts",
				description: "Important facts or characteristics",
				type: "array",
				priority: "required",
			},
			{
				key: "historical_context",
				description: "Historical background or timeline",
				type: "array",
				priority: "optional",
			},
			{
				key: "notable_people",
				description: "Important people related to this topic",
				type: "array",
				priority: "optional",
			},
			{
				key: "related_concepts",
				description: "Related topics or concepts",
				type: "array",
				priority: "optional",
			},
			{
				key: "applications_uses",
				description: "Practical applications or uses",
				type: "array",
				priority: "optional",
			},
			{
				key: "references",
				description: "External references or citations",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) clear definition, (2) key characteristics and facts, (3) historical context, (4) significance and applications",
		extractionHints:
			"Extract factual, objective information. Look for dates, names, and verifiable facts.",
	},

	generic: {
		name: "Generic Web Content",
		description: "General web page content",
		fields: [
			{
				key: "main_topics",
				description: "Main topics or themes",
				type: "array",
				priority: "required",
			},
			{
				key: "key_points",
				description: "Important points or information",
				type: "array",
				priority: "required",
			},
			{
				key: "entities_mentioned",
				description: "People, organizations, or products mentioned",
				type: "array",
				priority: "optional",
			},
			{
				key: "technologies",
				description: "Technologies or tools mentioned",
				type: "array",
				priority: "optional",
			},
			{
				key: "links_references",
				description: "Important external links or references",
				type: "array",
				priority: "optional",
			},
			{
				key: "actionable_items",
				description: "Action items or next steps",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) main purpose or message, (2) key information, (3) important details",
		extractionHints:
			"Extract the most relevant and useful information based on the content's apparent purpose.",
	},

	product: {
		name: "Product/Shopping Page",
		description: "E-commerce product page or shopping listing",
		fields: [
			{
				key: "product_name",
				description: "Product name or model",
				type: "string",
				priority: "required",
			},
			{
				key: "brand",
				description: "Brand or manufacturer",
				type: "string",
				priority: "required",
			},
			{
				key: "price",
				description: "Current price with currency",
				type: "string",
				priority: "optional",
				examples: ["$499", "¥3,999", "€299"],
			},
			{
				key: "category",
				description: "Product category",
				type: "string",
				priority: "optional",
				examples: ["Electronics", "Clothing", "Home & Kitchen"],
			},
			{
				key: "specifications",
				description: "Key technical specifications or features",
				type: "array",
				priority: "required",
				examples: ["Storage: 256GB", "Weight: 1.5 kg", "Color: Space Gray"],
			},
			{
				key: "dimensions",
				description: "Physical dimensions or size",
				type: "string",
				priority: "optional",
				examples: ["14.2 x 9.8 x 0.6 inches", "Size: Large"],
			},
			{
				key: "materials",
				description: "Materials used",
				type: "array",
				priority: "optional",
				examples: ["Aluminum", "Cotton", "Stainless Steel"],
			},
			{
				key: "colors_available",
				description: "Available color options",
				type: "array",
				priority: "optional",
			},
			{
				key: "key_features",
				description: "Main product features or selling points",
				type: "array",
				priority: "required",
			},
			{
				key: "compatibility",
				description: "Compatible devices or systems",
				type: "array",
				priority: "optional",
			},
			{
				key: "warranty",
				description: "Warranty information",
				type: "string",
				priority: "optional",
			},
			{
				key: "rating",
				description: "Customer rating or review score",
				type: "string",
				priority: "optional",
				examples: ["4.5/5", "4.8 stars"],
			},
		],
		summaryGuidelines:
			"Focus on: (1) what the product is and who it's for, (2) key features and specifications, (3) standout qualities or unique selling points, (4) price and value proposition",
		extractionHints:
			"Extract concrete specifications with units. Keep brand names, model numbers, and technical specs precise. Separate different specs into distinct array items (e.g., 'Weight: 1.5 kg' as one item, 'Storage: 256GB' as another).",
	},

	recipe: {
		name: "Recipe",
		description: "Cooking recipe or food preparation guide",
		fields: [
			{
				key: "dish_name",
				description: "Name of the dish",
				type: "string",
				priority: "required",
			},
			{
				key: "cuisine_type",
				description: "Cuisine type or origin",
				type: "string",
				priority: "optional",
				examples: ["Italian", "Chinese", "Mexican", "French"],
			},
			{
				key: "prep_time",
				description: "Preparation time",
				type: "string",
				priority: "optional",
				examples: ["15 minutes", "30 min"],
			},
			{
				key: "cook_time",
				description: "Cooking time",
				type: "string",
				priority: "optional",
				examples: ["45 minutes", "1 hour"],
			},
			{
				key: "servings",
				description: "Number of servings",
				type: "string",
				priority: "optional",
				examples: ["4 servings", "Serves 6"],
			},
			{
				key: "difficulty",
				description: "Difficulty level",
				type: "string",
				priority: "optional",
				examples: ["Easy", "Medium", "Advanced"],
			},
			{
				key: "ingredients",
				description: "List of ingredients with quantities",
				type: "array",
				priority: "required",
				examples: ["2 cups flour", "1 tsp salt", "3 eggs"],
			},
			{
				key: "main_steps",
				description: "Key cooking steps or instructions",
				type: "array",
				priority: "required",
			},
			{
				key: "dietary_info",
				description: "Dietary information or restrictions",
				type: "array",
				priority: "optional",
				examples: ["Vegetarian", "Gluten-free", "Low-carb", "Vegan"],
			},
			{
				key: "nutrition_highlights",
				description: "Important nutritional information",
				type: "array",
				priority: "optional",
				examples: ["Calories: 350", "Protein: 25g"],
			},
			{
				key: "tips",
				description: "Cooking tips or variations",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) what the dish is and its origin, (2) key ingredients and flavors, (3) cooking method and difficulty, (4) time requirements and servings",
		extractionHints:
			"Keep ingredient measurements precise. Separate each ingredient into its own array item with full quantity info.",
	},

	tutorial: {
		name: "Tutorial/How-To Guide",
		description: "Step-by-step tutorial or instructional guide",
		fields: [
			{
				key: "tutorial_title",
				description: "What you'll learn or accomplish",
				type: "string",
				priority: "required",
			},
			{
				key: "difficulty_level",
				description: "Skill level required",
				type: "string",
				priority: "optional",
				examples: ["Beginner", "Intermediate", "Advanced"],
			},
			{
				key: "time_required",
				description: "Estimated time to complete",
				type: "string",
				priority: "optional",
				examples: ["30 minutes", "2 hours", "1 week"],
			},
			{
				key: "prerequisites",
				description: "Required knowledge or tools",
				type: "array",
				priority: "optional",
				examples: ["Basic JavaScript", "Node.js installed", "Screwdriver"],
			},
			{
				key: "materials_tools",
				description: "Materials or tools needed",
				type: "array",
				priority: "optional",
			},
			{
				key: "main_steps",
				description: "Key steps in the tutorial",
				type: "array",
				priority: "required",
			},
			{
				key: "learning_outcomes",
				description: "What you'll learn or achieve",
				type: "array",
				priority: "required",
			},
			{
				key: "common_mistakes",
				description: "Common pitfalls to avoid",
				type: "array",
				priority: "optional",
			},
			{
				key: "tips_best_practices",
				description: "Expert tips and best practices",
				type: "array",
				priority: "optional",
			},
			{
				key: "related_topics",
				description: "Related skills or topics",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) what the tutorial teaches and why it's useful, (2) prerequisites and difficulty level, (3) main steps and approach, (4) key takeaways and outcomes",
		extractionHints:
			"Focus on actionable steps and clear learning objectives. Distinguish between prerequisites and outcomes.",
	},

	news: {
		name: "News Article",
		description: "News story or current events coverage",
		fields: [
			{
				key: "headline",
				description: "Main headline or story title",
				type: "string",
				priority: "required",
			},
			{
				key: "publication",
				description: "News organization or publication",
				type: "string",
				priority: "optional",
			},
			{
				key: "publication_date",
				description: "Publication date and time",
				type: "string",
				priority: "optional",
			},
			{
				key: "location",
				description: "Where the story takes place",
				type: "string",
				priority: "optional",
			},
			{
				key: "main_event",
				description: "Central event or development",
				type: "string",
				priority: "required",
			},
			{
				key: "key_people",
				description: "People involved or quoted",
				type: "array",
				priority: "optional",
			},
			{
				key: "key_organizations",
				description: "Organizations or institutions involved",
				type: "array",
				priority: "optional",
			},
			{
				key: "timeline",
				description: "Important dates or sequence of events",
				type: "array",
				priority: "optional",
			},
			{
				key: "impact",
				description: "Significance or consequences",
				type: "array",
				priority: "optional",
			},
			{
				key: "background_context",
				description: "Background information or context",
				type: "array",
				priority: "optional",
			},
			{
				key: "quotes",
				description: "Notable quotes from the article",
				type: "array",
				priority: "optional",
			},
			{
				key: "data_statistics",
				description: "Important numbers or statistics",
				type: "array",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) what happened and where, (2) who is involved, (3) why it matters and the impact, (4) context and background. Follow journalistic 5W1H approach.",
		extractionHints:
			"Prioritize facts over opinions. Extract specific dates, numbers, and quotes accurately. Distinguish between the current event and background information.",
	},

	review: {
		name: "Review/Opinion Piece",
		description: "Product review, critique, or opinion article",
		fields: [
			{
				key: "subject",
				description: "What is being reviewed",
				type: "string",
				priority: "required",
			},
			{
				key: "category",
				description: "Type of subject",
				type: "string",
				priority: "optional",
				examples: ["Movie", "Book", "Product", "Restaurant", "Service"],
			},
			{
				key: "reviewer",
				description: "Reviewer name or publication",
				type: "string",
				priority: "optional",
			},
			{
				key: "rating",
				description: "Overall rating or score",
				type: "string",
				priority: "optional",
				examples: ["4/5 stars", "8.5/10", "A-"],
			},
			{
				key: "pros",
				description: "Positive aspects or strengths",
				type: "array",
				priority: "required",
			},
			{
				key: "cons",
				description: "Negative aspects or weaknesses",
				type: "array",
				priority: "required",
			},
			{
				key: "standout_features",
				description: "Most notable or unique aspects",
				type: "array",
				priority: "optional",
			},
			{
				key: "comparison",
				description: "Comparisons to similar items",
				type: "array",
				priority: "optional",
			},
			{
				key: "recommendation",
				description: "Who this is recommended for",
				type: "string",
				priority: "optional",
			},
			{
				key: "value_assessment",
				description: "Value for money or worth",
				type: "string",
				priority: "optional",
			},
			{
				key: "verdict",
				description: "Final verdict or conclusion",
				type: "string",
				priority: "optional",
			},
		],
		summaryGuidelines:
			"Focus on: (1) what is being reviewed and context, (2) balanced pros and cons, (3) standout features or aspects, (4) overall assessment and recommendations",
		extractionHints:
			"Balance positive and negative points. Extract the reviewer's main arguments and supporting evidence. Identify specific comparisons and recommendations.",
	},
};

/**
 * Get template for a specific content type
 */
export function getTemplate(contentType: ContentType): ContentTemplate {
	return CONTENT_TEMPLATES[contentType] || CONTENT_TEMPLATES["generic"];
}

/**
 * Generate JSON schema for a template's fields
 */
export function generateSchemaFromTemplate(template: ContentTemplate): object {
	const properties: Record<string, unknown> = {};
	const required: string[] = [];

	for (const field of template.fields) {
		if (field.type === "array") {
			properties[field.key] = {
				type: "array",
				items: { type: "string" },
				description: field.description,
			};
		} else if (field.type === "object") {
			properties[field.key] = {
				type: "object",
				description: field.description,
				additionalProperties: true,
			};
		} else {
			properties[field.key] = {
				type: "string",
				description: field.description,
			};
		}

		if (field.priority === "required") {
			required.push(field.key);
		}
	}

	return {
		type: "object",
		properties,
		required,
		additionalProperties: false,
	};
}

/**
 * Generate prompt section describing template fields
 */
export function generateFieldsPromptSection(template: ContentTemplate): string {
	const requiredFields = template.fields.filter(
		(f) => f.priority === "required"
	);
	const optionalFields = template.fields.filter(
		(f) => f.priority === "optional"
	);

	let prompt = "## Required Fields:\n";
	for (const field of requiredFields) {
		prompt += `- **${field.key}**: ${field.description}`;
		if (field.examples && field.examples.length > 0) {
			prompt += ` (e.g., ${field.examples.join(", ")})`;
		}
		prompt += "\n";
	}

	if (optionalFields.length > 0) {
		prompt += "\n## Optional Fields (include if found):\n";
		for (const field of optionalFields) {
			prompt += `- **${field.key}**: ${field.description}`;
			if (field.examples && field.examples.length > 0) {
				prompt += ` (e.g., ${field.examples.join(", ")})`;
			}
			prompt += "\n";
		}
	}

	return prompt;
}
