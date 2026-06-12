// TCF Professional Question Database - 22 Questions
const questions = [
    {
        id: 1,
        text: "Chaque matin, je ______ un café avant de travailler.",
        options: ["prends", "prend", "prennent", "prenez"],
        correct: 0,
        difficulty: "A2",
        explanation: "'Je' requires first person singular: prends"
    },
    {
        id: 2,
        text: "Nous ______ au cinéma hier soir.",
        options: ["sommes allés", "avons allés", "sommes allé", "avons allé"],
        correct: 0,
        difficulty: "A2",
        explanation: "Passé composé with être + agreement: sommes allés"
    },
    {
        id: 3,
        text: "______ tu fais ce weekend?",
        options: ["Que", "Qu'est-ce que", "Quoi", "Comment"],
        correct: 0,
        difficulty: "A2",
        explanation: "Formal inversion: 'Que fais-tu?'"
    },
    {
        id: 4,
        text: "Si j'avais su, je ______ venu plus tôt.",
        options: ["serais", "aurais", "étais", "avais"],
        correct: 1,
        difficulty: "B1",
        explanation: "Conditionnel passé: j'aurais venu"
    },
    {
        id: 5,
        text: "Il faut que tu ______ tes devoirs avant de sortir.",
        options: ["fais", "fasses", "faire", "feras"],
        correct: 1,
        difficulty: "B1",
        explanation: "Subjonctif after 'il faut que': fasses"
    },
    {
        id: 6,
        text: "Le film ______ nous avons parlé est excellent.",
        options: ["que", "dont", "auquel", "lequel"],
        correct: 1,
        difficulty: "B1",
        explanation: "Pronom relatif 'dont' replaces 'de ce film'"
    },
    {
        id: 7,
        text: "______ la pluie, nous sommes sortis.",
        options: ["Malgré", "Cependant", "Pourtant", "Bien que"],
        correct: 0,
        difficulty: "B1",
        explanation: "Malgré + noun = despite the rain"
    },
    {
        id: 8,
        text: "Je cherche un appartement ______ soit proche du métro.",
        options: ["qui", "que", "dont", "où"],
        correct: 0,
        difficulty: "B1",
        explanation: "Relative pronoun 'qui' as subject"
    },
    {
        id: 9,
        text: "Elle m'a demandé ______ je voulais l'accompagner.",
        options: ["si", "que", "ce que", "est-ce que"],
        correct: 0,
        difficulty: "B2",
        explanation: "Indirect question with 'si' (if)"
    },
    {
        id: 10,
        text: "Quoique ______, il reste calme.",
        options: ["il arrive", "qu'il arrive", "il arriverait", "il arrivait"],
        correct: 1,
        difficulty: "B2",
        explanation: "Subjunctive after 'quoique': qu'il arrive"
    },
    {
        id: 11,
        text: "Les enfants, ______ ont joué dehors, sont fatigués.",
        options: ["qui", "que", "dont", "lesquels"],
        correct: 0,
        difficulty: "B2",
        explanation: "'Qui' refers to subject 'les enfants'"
    },
    {
        id: 12,
        text: "Elle a réussi ______ ses examens haut la main.",
        options: ["à", "de", "par", "pour"],
        correct: 0,
        difficulty: "B2",
        explanation: "Réussir à = to succeed in"
    },
    {
        id: 13,
        text: "Bien qu'il ______ fatigué, il a continué.",
        options: ["est", "soit", "était", "serait"],
        correct: 1,
        difficulty: "C1",
        explanation: "Subjunctive after 'bien que': soit"
    },
    {
        id: 14,
        text: "C'est l'acteur ______ j'ai vu le dernier film.",
        options: ["duquel", "dont", "auquel", "lequel"],
        correct: 0,
        difficulty: "C1",
        explanation: "Duquel = of whom / whose"
    },
    {
        id: 15,
        text: "______ te dire, je ne suis pas convaincu.",
        options: ["Tant", "Autant", "Pour", "Afin"],
        correct: 1,
        difficulty: "C1",
        explanation: "Autant te dire = might as well tell you"
    },
    {
        id: 16,
        text: "Ça m'est ______ ! (It's all the same to me)",
        options: ["égal", "pareil", "identique", "similaire"],
        correct: 0,
        difficulty: "B1",
        explanation: "Ça m'est égal = common expression"
    },
    {
        id: 17,
        text: "Il ______ de ses affaires. (He takes care of his business)",
        options: ["s'occupe", "fait", "prend", "tient"],
        correct: 0,
        difficulty: "B1",
        explanation: "S'occuper de = to take care of"
    },
    {
        id: 18,
        text: "Nous avons ______ rendez-vous important.",
        options: ["un", "une", "des", "de"],
        correct: 0,
        difficulty: "A2",
        explanation: "Rendez-vous is masculine: un rendez-vous"
    },
    {
        id: 19,
        text: "Je viens ______ Paris.",
        options: ["de", "à", "en", "dans"],
        correct: 0,
        difficulty: "A2",
        explanation: "Venir de = to come from"
    },
    {
        id: 20,
        text: "______ fois, il faut savoir dire non.",
        options: ["Des", "Par", "À", "Toute"],
        correct: 1,
        difficulty: "B2",
        explanation: "Parfois = sometimes"
    },
    {
        id: 21,
        text: "Elle est ______ en anglais.",
        options: ["forte", "fort", "force", "forcée"],
        correct: 0,
        difficulty: "B1",
        explanation: "Être forte en = to be good at"
    },
    {
        id: 22,
        text: "Le train ______ à 15h00.",
        options: ["part", "pars", "partez", "partent"],
        correct: 0,
        difficulty: "A2",
        explanation: "Subject 'le train' = 3rd person singular"
    }
];

const totalQuestions = questions.length;
