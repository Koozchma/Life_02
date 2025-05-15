document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const moneyDisplay = document.getElementById('money-display');
    const activeIncomeDisplay = document.getElementById('active-income-display');
    const passiveIncomeDisplay = document.getElementById('passive-income-display');
    const careerTitleDisplay = document.getElementById('career-title-display');
    const grindProgressDisplay = document.getElementById('grind-progress-display');
    const grindButton = document.getElementById('grind-button');
    const storyDisplay = document.getElementById('story-display');
    const eventLog = document.getElementById('event-log');
    const passiveOptionsDisplay = document.getElementById('passive-options-display');

    // --- Game State Variables ---
    let money = 50; // Start with a little seed money
    let activeIncome = 1; // Salary per 10 grinds
    let passiveIncomeRate = 0; // Money per second
    let grindClicks = 0;
    let careerStage = 0; // Index for story progression
    let debtThreshold = -50; // Initial debt threshold

    // --- Game Data ---
    const storySegments = [
        // Stage 0
        { title: "Unemployed", text: "The city is vast, your wallet is mostly empty. Time to find any work.", events: [] },
        // Stage 1 (after 10 clicks)
        { title: "Intern - Data Entry", text: "You landed an internship at a small tech firm, 'ByteSize Solutions'. Tedious data entry, but it's a start.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'coffeeFund', delay: 500 }
        ]},
        // Stage 2
        { title: "Junior Analyst - ByteSize", text: "Your persistence paid off. You're now a Junior Analyst. More responsibility, slightly better pay.", events: [
            { type: 'NEGATIVE_MONEY', message: "Your ancient laptop finally gave out! Essential replacement cost: $75", value: -75, delay: 2000 }
        ]},
        // Stage 3
        { title: "Analyst - Synapse Project", text: "ByteSize tasks you with analyzing a new project: 'Synapse'. It's a revolutionary neural interface concept. You see its immense potential.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'onlineCourses', delay: 500 }
        ]},
        // Stage 4
        { title: "Lead Analyst - Synapse", text: "Your insights on Synapse are invaluable. You're leading the initial research team!", events: [
             { type: 'POSITIVE_MONEY', message: "Small bonus for your groundbreaking work on Synapse! +$150", value: 150, delay: 1000}
        ]},
        // Stage 5
        { title: "Project Manager - Synapse Launch", text: "Synapse is ready for its first B2B launch under your management. The pressure is immense, but the excitement is palpable.", events: [
            { type: 'NEGATIVE_MONEY', message: "A competitor tried to poach a key team member! A counter-offer and loyalty bonus cost you $250.", value: -250, delay: 1500},
            { type: 'UNLOCK_PASSIVE', passiveId: 'stockOptions', delay: 500 }
        ]},
        // Stage 6
        { title: "VP of Innovation - Synapse Inc.", text: "The Synapse launch was a major success! ByteSize spun it off into 'Synapse Inc.' and you're a VP! You meet Marcus Thorne, a savvy angel investor.", events: [
             { type: 'POSITIVE_MONEY', message: "Marcus Thorne makes an initial seed investment! +$2000", value: 2000, delay: 1000}
        ]},
        // Stage 7
        { title: "CEO - Synapse Inc.", text: "With Thorne's backing, you've taken the helm as CEO. Synapse Inc. is rapidly expanding, but Helios Corp. and the formidable Augustus Sterling are now watching your every move.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'realEstate', delay: 500 },
            { type: 'NEGATIVE_MONEY', message: "Helios Corp initiates a frivolous patent lawsuit to slow you down! Initial legal defense fees: $750", value: -750, delay: 3000 }
        ]},
        // Stage 8
        { title: "Expanding Tycoon", text: "Synapse Inc. is a market leader. You're acquiring smaller companies and diversifying. Sterling's shadow looms larger.", events: [
            { type: 'UNLOCK_PASSIVE', passiveId: 'ventureCapital', delay: 500},
            { type: 'NEGATIVE_MONEY', message: "A hostile takeover attempt on a subsidiary! You had to spend big to fend it off: $1500", value: () => Math.min(-1500, -money * 0.1), // Costs at least 1500, or 10% of current money if that's more, up to a cap if needed.
            delay: 2000 }
        ]},
        // Stage 9
        { title: "Global Powerhouse", text: "Your empire rivals the giants. The final confrontation with The Concord and Augustus Sterling is inevitable. The stakes have never been higher.", events: [
            { type: 'POSITIVE_MONEY', message: "Major government contract secured! +$10000", value: 10000, delay: 1000 },
            { type: 'UNLOCK_PASSIVE', passiveId: 'globalConglomerate', delay: 500 },
            { type: 'NEGATIVE_MONEY', message: "Sterling launches a massive smear campaign and market manipulation! Cost to counter and stabilize: 20% of your current wealth!", value: () => -(money * 0.20), delay: 4000 }
        ]},
        { title: "Apex Predator", text: "You've weathered the storm, perhaps even dismantled parts of The Concord. Your empire is vast, but the game of power never truly ends.", events: [] }
    ];

    const passiveIncomeSources = [
        { id: 'coffeeFund', name: "Personal Coffee Fund", cost: 30, income: 0.2, unlocked: false, purchased: false, description: "Keeps you sharp. +$0.2/sec" },
        { id: 'onlineCourses', name: "Invest in Online Courses", cost: 150, income: 0.8, unlocked: false, purchased: false, description: "Continuous learning. +$0.8/sec" },
        { id: 'stockOptions', name: "Early Synapse Stock Options", cost: 750, income: 4.0, unlocked: false, purchased: false, description: "Calculated risk. +$4/sec" },
        { id: 'realEstate', name: "Commercial Property Portfolio", cost: 3000, income: 15, unlocked: false, purchased: false, description: "Tangible assets. +$15/sec" },
        { id: 'ventureCapital', name: "Venture Capital Arm", cost: 10000, income: 50, unlocked: false, purchased: false, description: "Investing in the future. +$50/sec"},
        { id: 'globalConglomerate', name: "Own a Global Conglomerate Piece", cost: 50000, income: 250, unlocked: false, purchased: false, description: "True power. +$250/sec"},
    ];

    // --- Functions ---

    function updateDisplays() {
        moneyDisplay.textContent = money.toFixed(2);
        activeIncomeDisplay.textContent = activeIncome.toFixed(2);
        passiveIncomeDisplay.textContent = passiveIncomeRate.toFixed(2);
        careerTitleDisplay.textContent = storySegments[careerStage].title;
        grindProgressDisplay.textContent = grindClicks;

        passiveOptionsDisplay.innerHTML = '';
        passiveIncomeSources.forEach(source => {
            if (source.unlocked) {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('passive-item');
                itemDiv.innerHTML = `
                    <span>${source.name} (${source.description}) - Cost: $${source.cost.toFixed(2)}</span>
                    <button data-id="${source.id}" ${source.purchased || money < source.cost ? 'disabled' : ''}>
                        ${source.purchased ? 'Owned' : 'Buy'}
                    </button>
                `;
                passiveOptionsDisplay.appendChild(itemDiv);
                if (!source.purchased) {
                    itemDiv.querySelector('button').addEventListener('click', () => purchasePassiveIncome(source.id));
                }
            }
        });
    }

    function logEvent(message, type = '') {
        const p = document.createElement('p');
        p.textContent = message;
        if (type) {
            p.classList.add(type);
        }
        eventLog.insertBefore(p, eventLog.firstChild);
        if (eventLog.children.length > 15) {
            eventLog.removeChild(eventLog.lastChild);
        }
    }

    function handleGameEvent(eventData) {
        // Process dynamic event values
        let eventVal = 0;
        if (typeof eventData.value === 'function') {
            eventVal = eventData.value();
        } else if (typeof eventData.value === 'number') {
            eventVal = eventData.value;
        }

        logEvent(eventData.message, eventVal > 0 ? 'positive' : (eventVal < 0 ? 'negative' : 'neutral'));
        
        if (eventData.type === 'POSITIVE_MONEY' || eventData.type === 'NEGATIVE_MONEY') {
            money += eventVal;
            checkFinancialStatus();
        } else if (eventData.type === 'UNLOCK_PASSIVE') {
            const sourceToUnlock = passiveIncomeSources.find(s => s.id === eventData.passiveId);
            if (sourceToUnlock) {
                sourceToUnlock.unlocked = true;
                logEvent(`New Investment Opportunity: ${sourceToUnlock.name}!`, 'positive');
            }
        }
        updateDisplays();
    }

    function checkFinancialStatus() {
        if (money < debtThreshold) {
            logEvent(`CRITICAL: Debt is spiraling! You're forced to liquidate a small asset!`, 'negative');
            // Simple penalty: lose a small amount of passive income or a fixed cash penalty
            const reduction = Math.min(passiveIncomeRate * 0.1, 5); // Lose 10% of passive income, capped at $5/sec for this penalty
            if (passiveIncomeRate > 0 && reduction > 0.01) {
                passiveIncomeRate -= reduction;
                passiveIncomeRate = Math.max(0, passiveIncomeRate); // Ensure it doesn't go negative
                logEvent(`Passive income reduced by $${reduction.toFixed(2)}/sec due to debt!`, 'negative');

                // Potentially mark a cheap passive income source as "not purchased" again if severe
                // For now, just a rate reduction.
            } else {
                money -= 50; // Flat penalty if no passive income to reduce meaningfully
                logEvent(`Further penalty of $50 due to unresolved debt!`, 'negative');
            }
            // Make the next debt threshold more severe or trigger different events.
            debtThreshold *= 1.5; // It gets harder to stay in debt
        } else if (money < 0 && money >= debtThreshold) {
             logEvent("Warning: Your finances are in the red. Be careful!", "negative");
        }
    }


    function triggerStoryProgression() {
        storyDisplay.textContent = storySegments[careerStage].text;
        logEvent(`Career Update: You are now ${storySegments[careerStage].title}`, 'neutral');
        debtThreshold = -50 - (careerStage * 25); // Debt becomes more impactful as you progress

        if (storySegments[careerStage].events && storySegments[careerStage].events.length > 0) {
            storySegments[careerStage].events.forEach(event => {
                setTimeout(() => handleGameEvent(event), event.delay || 0);
            });
        }
        updateDisplays();
    }

    function handleGrindClick() {
        grindClicks++;
        if (grindClicks >= 10) {
            money += activeIncome;
            grindClicks = 0;
            
            // Scaled active income increase:
            // Increases by a base related to career stage, ensuring it stays relevant.
            let incomeIncrease = Math.ceil((careerStage + 1) * 0.5 + (activeIncome * 0.05));
            activeIncome += Math.max(1, incomeIncrease); // Always increase by at least 1

            if (careerStage < storySegments.length - 1) {
                careerStage++;
                triggerStoryProgression();
            } else {
                storyDisplay.textContent = storySegments[careerStage].text + " You've reached the pinnacle... for now.";
                // Consider adding repeatable "late game" events or challenges here
            }
            checkFinancialStatus(); // Check finances after income gain
        }
        updateDisplays();
    }

    function purchasePassiveIncome(sourceId) {
        const source = passiveIncomeSources.find(s => s.id === sourceId);
        if (source && !source.purchased && money >= source.cost) {
            money -= source.cost;
            passiveIncomeRate += source.income;
            source.purchased = true; // Mark as purchased
            logEvent(`Purchased ${source.name}. Passive income increased by $${source.income.toFixed(2)}/sec!`, 'positive');
            updateDisplays();
        } else if (source && money < source.cost) {
            logEvent(`Not enough money to purchase ${source.name}. Need $${source.cost.toFixed(2)}.`, 'negative');
        }
    }

    function applyPassiveIncome() {
        money += passiveIncomeRate;
        // It's important to call updateDisplays less frequently than every passive income tick if it's very small
        // For now, updating every second with passive income is fine.
        // If passive income ticks more frequently (e.g. 10x/sec), updateDisplay should be throttled.
        updateDisplays();
    }

    // --- Initialization ---
    function initializeGame() {
        triggerStoryProgression();
        updateDisplays();
        grindButton.addEventListener('click', handleGrindClick);
        setInterval(applyPassiveIncome, 1000);
    }

    initializeGame();
});
