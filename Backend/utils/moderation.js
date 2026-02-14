const OpenAI = require('openai');
const User = require('../models/User');

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/**
 * Fallback rule-based moderation logic
 */
const ruleBasedFallback = (text) => {
    const msg = text.trim();

    // Very short check
    if (msg.length < 10) {
        return {
            classification: 'LOW_QUALITY',
            confidence: 1.0,
            reason: 'Message is extremely short.',
            suggestion: 'Please provide more details about your goals or background.'
        };
    }

    // Repeated characters check (e.g., "aaaaaaaaa")
    if (/(.)\1{5,}/.test(msg)) {
        return {
            classification: 'SPAM',
            confidence: 0.9,
            reason: 'Text contains unusual character repetitions.',
            suggestion: 'Please provide meaningful content.'
        };
    }

    // Common spam keywords
    const spamKeywords = ['free money', 'crypto winner', 'click here', 'buy now', 'cheap', 'viagra'];
    if (spamKeywords.some(keyword => msg.toLowerCase().includes(keyword))) {
        return {
            classification: 'SUSPICIOUS',
            confidence: 0.8,
            reason: 'Text contains common spam-related keywords.',
            suggestion: 'Your message looks like marketing. Please keep it community-focused.'
        };
    }

    return {
        classification: 'CLEAR',
        confidence: 1.0,
        reason: 'Passed rule-based checks.',
        suggestion: null
    };
};

/**
 * Main moderation function
 * @param {string} text - The text to moderate
 * @param {string} type - 'skill' | 'request' | 'bio'
 */
const checkTextQuality = async (text, type = 'request') => {
    if (!openai) {
        console.warn('OpenAI API key missing. Using rule-based fallback.');
        return ruleBasedFallback(text);
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a moderation assistant for a skill-sharing community platform. Classify user text for spam, low quality, or genuine intent. Be conservative. Do not over-flag. Never suggest punishment."
                },
                {
                    role: "user",
                    content: `Analyze the following ${type} text and return a JSON response.\n\nText:\n"${text}"\n\nReturn JSON ONLY with fields:\n- classification: one of [CLEAR, LOW_QUALITY, SPAM, SUSPICIOUS]\n- confidence: number between 0 and 1\n- reason: short explanation\n- suggestion: how to improve (if not CLEAR)`
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error('Moderation API error:', error);
        return ruleBasedFallback(text);
    }
};

/**
 * Check if user is blocked due to spam
 */
const isUserSpamBlocked = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return false;

    // Block if > 3 spam attempts in 24 hours
    const cooldownPeriod = 24 * 60 * 60 * 1000;
    if (user.spamAttemptCount >= 3) {
        const timeSinceLastSpam = Date.now() - new Date(user.lastSpamAttempt).getTime();
        if (timeSinceLastSpam < cooldownPeriod) {
            return true;
        } else {
            // Reset after cooldown
            user.spamAttemptCount = 0;
            await user.save();
            return false;
        }
    }

    return false;
};

module.exports = {
    checkTextQuality,
    isUserSpamBlocked
};
