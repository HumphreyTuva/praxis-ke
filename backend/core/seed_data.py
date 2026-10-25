"""Starter content drawn directly from the Praxis KE developer brief.

No statistics, partners, testimonials or accreditation claims — add real ones
via the admin only once they are confirmed.
"""

PILLARS = [
    {
        "slug": "policy-design-and-feasibility",
        "title": "Policy Design & Feasibility",
        "icon": "design",
        "summary": "Why some policies make realistic assumptions about resources, incentives and behaviour, while others are hard to implement from the outset.",
        "description": "Policies are designed by people with limited information and time. We look at whether a policy's assumptions about resources, incentives and human behaviour hold up, and where design choices make later implementation easier or harder. Topics include policy design, feasibility, bounded rationality and unintended consequences.",
        "key_questions": [
            "What did the policy assume about budgets, capacity and behaviour, and were those assumptions realistic?",
            "Which design choices anticipated implementation problems, and which created them?",
            "What unintended consequences could have been foreseen at the design stage?",
        ],
        "order": 1,
    },
    {
        "slug": "implementation-and-institutional-capacity",
        "title": "Implementation & Institutional Capacity",
        "icon": "implementation",
        "summary": "How funding, administrative capability, coordination and frontline discretion shape delivery and outcomes.",
        "description": "A policy is only as strong as the institutions that carry it out. We examine how funding, administrative capability, coordination between agencies, bureaucratic incentives and the discretion of frontline officials shape what is actually delivered.",
        "key_questions": [
            "Which institutions are responsible for delivery, and do they have the resources and authority to deliver?",
            "How do coordination gaps and bureaucratic incentives change what happens on the ground?",
            "How much discretion do frontline officials have, and how is it used?",
        ],
        "order": 2,
    },
    {
        "slug": "political-incentives-and-accountability",
        "title": "Political Incentives & Accountability",
        "icon": "accountability",
        "summary": "How political interests, transparency, oversight and public pressure influence whether policies are implemented, changed, neglected or abandoned.",
        "description": "Policy outcomes depend on who gains, who loses and who is watching. We study how political interests, transparency, oversight, public pressure and institutional accountability influence whether policies are implemented, changed, neglected or abandoned.",
        "key_questions": [
            "When does access to information lead to oversight and corrective action, and when does it not?",
            "Which political incentives sustain a policy, and which cause it to be neglected or abandoned?",
            "What role do oversight bodies, courts, the media and the public play?",
        ],
        "order": 3,
    },
    {
        "slug": "comparative-and-international-policy-learning",
        "title": "Comparative & International Policy Learning",
        "icon": "comparative",
        "summary": "What countries can learn from one another, and why policies that work in one context may fail when transferred without adaptation.",
        "description": "Countries often adopt similar policies to solve similar problems, yet results differ. We compare contexts carefully to identify what explains the differences and which lessons can realistically transfer, and what would need to be adapted.",
        "key_questions": [
            "When countries adopt similar policies, what explains the differences in their results?",
            "Which lessons transfer across contexts, and which depend on local conditions?",
            "What adaptation is needed before a policy is borrowed?",
        ],
        "order": 4,
    },
    {
        "slug": "policy-outcomes-evaluation-and-adaptation",
        "title": "Policy Outcomes, Evaluation & Adaptation",
        "icon": "outcomes",
        "summary": "How decision-makers assess results, identify unintended effects and revise policies as evidence and conditions change.",
        "description": "Good policy is revised in light of evidence. We look at how decision-makers assess results, detect unintended effects and adapt policies in response to evidence and changing conditions.",
        "key_questions": [
            "How are results measured, and by whom?",
            "How are unintended effects detected and acted on?",
            "What makes a policy easier to revise in response to evidence?",
        ],
        "order": 5,
    },
]

PUBLICATIONS = [
    {
        "slug": "from-transparency-to-accountability",
        "title": "From Transparency to Accountability",
        "subtitle": "Why Does Access to Public Information Produce Government Action in Some Contexts but Not Others? A Comparative Study of Kenya and South Africa.",
        "kind": "brief",
        "status": "forthcoming",
        "featured": True,
        "summary": "Access to public information does not automatically lead to a government response. This brief asks what conditions help transparency turn into oversight, response and corrective action.",
        "research_question": "Under what institutional and political conditions does access to public information lead to government accountability and corrective action in Kenya and South Africa?",
        "purpose": "To investigate why access to public information does not automatically lead to a government response. The brief will compare relevant legal frameworks, accountability mechanisms and carefully selected cases to identify the conditions that help transparency lead to oversight, response and corrective action.",
        "outputs": [
            "A concise comparison of relevant legal and institutional frameworks in both countries.",
            "Evidence from selected, verifiable cases of disclosure, institutional response and follow-through.",
            "An explanation of the mechanisms that help or prevent transparency from leading to corrective action.",
            "Practical recommendations grounded in the evidence, with attention to whether lessons can transfer across contexts.",
        ],
        "scope_note": "Planned as a 1,500–2,000-word policy brief. The Kenya–South Africa comparison is a proposal rather than a fixed commitment; the cases and scope will be narrowed to match the available evidence.",
        "regions": "Kenya, South Africa",
        "cover_url": "/brand/cover-transparency.webp",
        "pillars": ["political-incentives-and-accountability", "comparative-and-international-policy-learning"],
    }
]
