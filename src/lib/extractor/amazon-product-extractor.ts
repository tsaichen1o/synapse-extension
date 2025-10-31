import { PageContent } from '../types';

/**
 * Specialized extractor for Amazon product pages
 * Optimized for laptop/computer products with detailed specifications
 * 
 * Extracts:
 * - Product title, price, rating, and reviews
 * - Detailed specifications (CPU, RAM, Storage, Display, etc.)
 * - Feature bullets and product description
 * - Technical details table
 * - Images and variations
 * 
 * @returns {PageContent | null} Structured product information
 * Returns `null` if the page is not an Amazon product page
 */
export function extractAmazonProduct(doc: Document): PageContent | null {
    if (!doc.location.hostname.includes('amazon.')) {
        return null;
    }

    // Check for product identifier (ASIN)
    const asinMatch = doc.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    if (!asinMatch) {
        return null;
    }

    const asin = asinMatch[1];

    // Extract product title
    const titleElement = doc.querySelector('#productTitle');
    const title = titleElement ? titleElement.textContent?.trim() || '' : '';

    // Extract price
    const priceElement = doc.querySelector('.a-price .a-offscreen');
    const price = priceElement ? priceElement.textContent?.trim() : undefined;

    // Extract rating
    const ratingElement = doc.querySelector('[data-hook="rating-out-of-text"]');
    const rating = ratingElement ? ratingElement.textContent?.trim() : undefined;

    // Extract number of reviews
    const reviewsElement = doc.querySelector('#acrCustomerReviewText');
    const reviewCount = reviewsElement ? reviewsElement.textContent?.trim() : undefined;

    // Extract brand
    const brandElements = doc.querySelectorAll('tr.po-brand td.a-span9 span');
    let brand: string | undefined;
    if (brandElements.length > 0) {
        brand = brandElements[0].textContent?.trim();
    }
    if (!brand) {
        const brandLink = doc.querySelector('#bylineInfo');
        if (brandLink) {
            const brandText = brandLink.textContent?.trim() || '';
            brand = brandText.replace(/^(Visit the|Brand:\s*)/i, '').trim();
        }
    }

    // Extract feature bullets
    const features: string[] = [];
    const featureBullets = doc.querySelectorAll('#feature-bullets ul li span.a-list-item');
    featureBullets.forEach(bullet => {
        const text = bullet.textContent?.trim();
        if (text && text.length > 0) {
            features.push(text);
        }
    });

    // Extract About this item section (alternative to feature bullets)
    if (features.length === 0) {
        const aboutItems = doc.querySelectorAll('[data-feature-name="featurebullets"] .a-unordered-list li span');
        aboutItems.forEach(item => {
            const text = item.textContent?.trim();
            if (text && text.length > 0 && !text.startsWith('›')) {
                features.push(text);
            }
        });
    }

    // Extract product description
    const descElement = doc.querySelector('#productDescription p');
    const description = descElement ? descElement.textContent?.trim() : undefined;

    // Extract detailed specifications - This is critical for laptops
    const specs: Record<string, string> = {};

    // Method 1: Primary Technical Details tables with specific IDs
    // These are the most important tables containing detailed product specifications
    const techSpecSelectors = [
        '#productDetails_techSpec_section_1 tr',  // Summary section
        '#productDetails_techSpec_section_2 tr',  // Other Technical Details section
        '#productDetails_detailBullets_sections1 tr', // Additional Information section
        '#technicalSpecifications_section_1 tr',  // Alternative technical specs
        '#prodDetails table tr',                   // General product details
    ];

    techSpecSelectors.forEach(selector => {
        const rows = doc.querySelectorAll(selector);
        rows.forEach(row => {
            const th = row.querySelector('th');
            const td = row.querySelector('td');
            if (th && td) {
                const key = th.textContent?.trim() || '';
                const value = td.textContent?.trim() || '';
                // Filter out non-spec rows (like Customer Reviews, Best Sellers Rank, etc.)
                if (key && value && !key.includes('Customer Reviews') && !key.includes('Best Sellers Rank') && !key.includes('Date First Available')) {
                    specs[key] = value;
                }
            }
        });
    });

    // Method 2: Product Overview table (often has key specs)
    const overviewRows = doc.querySelectorAll('[id*="productOverview"] tr, .po-break-word');
    overviewRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const key = cells[0].textContent?.trim() || '';
            const value = cells[1].textContent?.trim() || '';
            if (key && value) {
                specs[key] = value;
            }
        }
    });

    // Method 3: Extract brand from structured data (JSON-LD) if not found yet
    if (!brand) {
        try {
            const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
            scriptTags.forEach(script => {
                try {
                    const jsonData = JSON.parse(script.textContent || '');
                    if (jsonData['@type'] === 'Product' && jsonData.brand) {
                        brand = jsonData.brand?.name || jsonData.brand;
                    }
                } catch (e) {
                    // Ignore parsing errors for individual scripts
                }
            });
        } catch (e) {
            // Ignore errors
        }
    }

    // Parse specifications from feature bullets for laptops
    const laptopSpecPatterns = {
        processor: /(?:Processor|CPU)[:\s]+(.+?)(?:\s*[-|,]|$)/i,
        ram: /(\d+\s*GB)\s*(?:DDR\d?|RAM|Memory)/i,
        storage: /(\d+\s*(?:GB|TB))\s*(?:SSD|HDD|Storage|Hard Drive)/i,
        display: /(\d+(?:\.\d+)?)\s*(?:inch|"|Inch)\s*(?:FHD|HD|4K|QHD)?/i,
        graphics: /(?:Graphics|GPU)[:\s]+(.+?)(?:\s*[-|,]|$)/i,
        os: /(?:OS|Operating System)[:\s]+(Windows|Mac|Linux|Chrome\s*OS)\s*\d*/i,
        battery: /(\d+\s*(?:mAh|Wh|hours?))\s*(?:battery|Battery)/i,
    };

    const allText = title + ' ' + features.join(' ') + ' ' + (description || '');

    Object.entries(laptopSpecPatterns).forEach(([key, pattern]) => {
        if (!specs[key]) {
            const match = allText.match(pattern);
            if (match) {
                specs[key] = match[1]?.trim() || match[0]?.trim();
            }
        }
    });

    // Extract images
    const images: string[] = [];

    // Main product image
    const mainImage = doc.querySelector('#landingImage, #imgBlkFront') as HTMLImageElement;
    if (mainImage && mainImage.src) {
        images.push(mainImage.src);
    }

    // Thumbnail images
    const thumbnails = doc.querySelectorAll('#altImages img, .imageThumbnail img');
    thumbnails.forEach(img => {
        const imgEl = img as HTMLImageElement;
        if (imgEl.src && !images.includes(imgEl.src)) {
            images.push(imgEl.src);
        }
    });

    // Extract availability
    const availElement = doc.querySelector('#availability span');
    const availability = availElement ? availElement.textContent?.trim() : undefined;

    // Build comprehensive content text
    const contentParts = [
        `Product: ${title}`,
        brand ? `Brand: ${brand}` : '',
        price ? `Price: ${price}` : '',
        rating ? `Rating: ${rating}` : '',
        reviewCount ? `Reviews: ${reviewCount}` : '',
        availability ? `Availability: ${availability}` : '',
        '\n=== Features ===',
        ...features,
        description ? `\n=== Description ===\n${description}` : '',
        '\n=== Specifications ===',
        ...Object.entries(specs).map(([key, value]) => `${key}: ${value}`),
    ];

    const fullText = contentParts.filter(Boolean).join('\n');

    const ret: PageContent = {
        title,
        url: doc.location.href.split('?')[0], // Remove query parameters
        fullText,
        metadata: {
            description: description || features.join(' '),
            contentType: 'product',
            tags: features,
            extra: {
                // Amazon-specific data stored in extra field
                asin,
                productType: 'amazon-product',
                brand,
                price,
                rating,
                reviewCount,
                availability,
                features: features,
                ...specs,
            }
        },
        images: [...new Set(images)],
        links: [], // Product pages don't typically have many relevant external links
        extractorType: 'generic' // Using 'generic' as the base type
    };
    console.log(ret);
    return ret;
}
