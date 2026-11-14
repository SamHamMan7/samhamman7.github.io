// Original study questions in the style of the Chemistry Olympiad and AI Olympiad exams. Not official material.
window.STUDY_TOPICS={"Chem Olympiad": ["Stoichiometry and limiting reactants", "Gas laws and kinetic theory", "Thermochemistry and Hess’s law", "Kinetics: rate laws, half-lives, mechanisms", "Equilibrium, Ksp and Le Châtelier", "Acids, bases, buffers and titrations", "Electrochemistry and redox", "Atomic structure, periodic trends and bonding", "Descriptive and laboratory chemistry", "Organic basics: functional groups and isomers"], "AI Olympiad": ["Python and NumPy fluency", "Linear algebra: vectors, matrices, eigenvalues", "Calculus and probability for ML", "Classical ML: regression, trees, k-NN, clustering", "Evaluation: metrics, validation, overfitting", "Neural networks and backpropagation", "Convolutional networks for images", "Sequence models, attention and transformers", "Training practice: optimizers, regularization, debugging"]};
window.STUDY_PROBLEMS=[
 {
  "id": "chem-01",
  "subject": "Chem Olympiad",
  "topic": "Stoichiometry",
  "title": "Limiting reactant",
  "statement": "Aluminum reacts with chlorine: 2 Al + 3 Cl₂ → 2 AlCl₃. If 5.40 g of Al (26.98 g/mol) and 10.65 g of Cl₂ (70.90 g/mol) react completely, what mass of AlCl₃ (133.33 g/mol) forms?",
  "choices": [
   "8.90 g",
   "13.4 g",
   "20.0 g",
   "26.7 g"
  ],
  "answer": 1,
  "hint": "Convert both to moles, then divide each by its coefficient to find which runs out first.",
  "solution": "Al: 5.40/26.98 = 0.200 mol. Cl₂: 10.65/70.90 = 0.150 mol. Per coefficient: 0.200/2 = 0.100 and 0.150/3 = 0.050, so Cl₂ is limiting. AlCl₃ formed = 0.1502 × (2/3) = 0.1001 mol, and 0.1001 × 133.33 = 13.4 g. Answer: B."
 },
 {
  "id": "chem-02",
  "subject": "Chem Olympiad",
  "topic": "Gases",
  "title": "Identify the gas",
  "statement": "A gas has a density of 1.96 g/L at 0 °C and 1.00 atm. Which gas is it? (R = 0.08206 L·atm/mol·K)",
  "choices": [
   "N₂",
   "O₂",
   "CO₂",
   "SO₂"
  ],
  "answer": 2,
  "hint": "Molar mass = dRT/P.",
  "solution": "M = (1.96)(0.08206)(273.15)/1.00 = 43.9 g/mol, which matches CO₂ (44.0 g/mol). Answer: C."
 },
 {
  "id": "chem-03",
  "subject": "Chem Olympiad",
  "topic": "Thermochemistry",
  "title": "Heat of combustion",
  "statement": "Standard enthalpies of formation (kJ/mol): CO₂(g) −393.5, H₂O(l) −285.8, C₂H₅OH(l) −277.7. What is ΔH° for C₂H₅OH(l) + 3 O₂(g) → 2 CO₂(g) + 3 H₂O(l)?",
  "choices": [
   "−1366.7 kJ",
   "−957.0 kJ",
   "−401.6 kJ",
   "+1366.7 kJ"
  ],
  "answer": 0,
  "hint": "ΔH° = Σ ΔHf(products) − Σ ΔHf(reactants). O₂ is an element in its standard state.",
  "solution": "Products: 2(−393.5) + 3(−285.8) = −1644.4 kJ. Reactants: −277.7 + 0. ΔH° = −1644.4 − (−277.7) = −1366.7 kJ. Answer: A."
 },
 {
  "id": "chem-04",
  "subject": "Chem Olympiad",
  "topic": "Kinetics",
  "title": "First-order decay",
  "statement": "A first-order reaction has a half-life of 20 minutes. What percent of the reactant remains after 60 minutes?",
  "choices": [
   "6.25%",
   "12.5%",
   "25%",
   "33%"
  ],
  "answer": 1,
  "hint": "For first order, every half-life cuts the amount in half regardless of how much is left.",
  "solution": "60 minutes is three half-lives, so (1/2)³ = 1/8 = 12.5% remains. Answer: B."
 },
 {
  "id": "chem-05",
  "subject": "Chem Olympiad",
  "topic": "Equilibrium",
  "title": "Dissociation of N₂O₄",
  "statement": "For N₂O₄(g) ⇌ 2 NO₂(g), Kc = 0.20 at a certain temperature. A flask initially contains only 1.00 M N₂O₄. What is [NO₂] at equilibrium?",
  "choices": [
   "0.20 M",
   "0.40 M",
   "0.45 M",
   "0.80 M"
  ],
  "answer": 1,
  "hint": "Let x be the decrease in [N₂O₄]; then [NO₂] = 2x. Solve the quadratic.",
  "solution": "(2x)²/(1.00 − x) = 0.20 gives 4x² + 0.20x − 0.20 = 0, so x = (−0.20 + √3.24)/8 = 0.200. [NO₂] = 2x = 0.40 M. Check: 0.16/0.80 = 0.20. Answer: B."
 },
 {
  "id": "chem-06",
  "subject": "Chem Olympiad",
  "topic": "Acids and bases",
  "title": "Weak acid pH",
  "statement": "What is the pH of 0.10 M acetic acid? (Ka = 1.8 × 10⁻⁵)",
  "choices": [
   "1.00",
   "2.87",
   "4.74",
   "5.74"
  ],
  "answer": 1,
  "hint": "[H⁺] ≈ √(Ka·C) when dissociation is small.",
  "solution": "[H⁺] = √(1.8×10⁻⁵ × 0.10) = 1.34×10⁻³ M, so pH = 2.87. (Only 1.3% dissociates, so the approximation holds.) Answer: B."
 },
 {
  "id": "chem-07",
  "subject": "Chem Olympiad",
  "topic": "Acids and bases",
  "title": "Half-neutralized",
  "statement": "0.050 mol of NaOH is added to 1.0 L of 0.10 M acetic acid (Ka = 1.8 × 10⁻⁵). What is the pH? Assume no volume change.",
  "choices": [
   "2.87",
   "4.44",
   "4.74",
   "7.00"
  ],
  "answer": 2,
  "hint": "After the reaction, compare moles of acid left with moles of conjugate base formed.",
  "solution": "NaOH converts 0.050 mol of acid to acetate, leaving 0.050 mol of each. With [HA] = [A⁻], pH = pKa = −log(1.8×10⁻⁵) = 4.74. Answer: C."
 },
 {
  "id": "chem-08",
  "subject": "Chem Olympiad",
  "topic": "Electrochemistry",
  "title": "Cell free energy",
  "statement": "For Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), E°(Cu²⁺/Cu) = +0.34 V and E°(Zn²⁺/Zn) = −0.76 V. What is ΔG°? (F = 96,485 C/mol)",
  "choices": [
   "−106 kJ",
   "−212 kJ",
   "−318 kJ",
   "+212 kJ"
  ],
  "answer": 1,
  "hint": "E°cell = E°cathode − E°anode, then ΔG° = −nFE°.",
  "solution": "E°cell = 0.34 − (−0.76) = 1.10 V, and n = 2. ΔG° = −(2)(96,485)(1.10) = −212,000 J = −212 kJ. Answer: B."
 },
 {
  "id": "chem-09",
  "subject": "Chem Olympiad",
  "topic": "Bonding",
  "title": "Molecular polarity",
  "statement": "Which molecule has a nonzero dipole moment?",
  "choices": [
   "CO₂",
   "BF₃",
   "SF₄",
   "XeF₄"
  ],
  "answer": 2,
  "hint": "Find each shape with VSEPR and ask whether the bond dipoles cancel.",
  "solution": "CO₂ is linear, BF₃ trigonal planar and XeF₄ square planar, so their bond dipoles cancel. SF₄ has five electron domains with one lone pair (see-saw), which does not cancel. Answer: C."
 },
 {
  "id": "chem-10",
  "subject": "Chem Olympiad",
  "topic": "Solubility",
  "title": "Common ion effect",
  "statement": "Ksp of AgCl is 1.8 × 10⁻¹⁰. What is its molar solubility in 0.10 M NaCl?",
  "choices": [
   "1.3 × 10⁻⁵ M",
   "1.8 × 10⁻⁹ M",
   "1.8 × 10⁻¹⁰ M",
   "1.8 × 10⁻¹¹ M"
  ],
  "answer": 1,
  "hint": "[Cl⁻] is essentially fixed at 0.10 M by the NaCl.",
  "solution": "Ksp = [Ag⁺][Cl⁻] = s(0.10), so s = 1.8×10⁻¹⁰/0.10 = 1.8×10⁻⁹ M. (In pure water it would be 1.3×10⁻⁵ M.) Answer: B."
 },
 {
  "id": "chem-11",
  "subject": "Chem Olympiad",
  "topic": "Organic",
  "title": "Alcohol isomers",
  "statement": "How many constitutional isomers with the formula C₄H₁₀O are alcohols?",
  "choices": [
   "2",
   "3",
   "4",
   "5"
  ],
  "answer": 2,
  "hint": "Draw the two butane skeletons and place the OH on each distinct carbon.",
  "solution": "Straight chain: 1-butanol and 2-butanol. Branched chain: 2-methyl-1-propanol and 2-methyl-2-propanol. That is 4 (the other C₄H₁₀O isomers are ethers). Answer: C."
 },
 {
  "id": "chem-12",
  "subject": "Chem Olympiad",
  "topic": "Solutions",
  "title": "Freezing point",
  "statement": "What is the freezing point of a 0.100 m aqueous CaCl₂ solution, assuming complete dissociation? (Kf = 1.86 °C/m)",
  "choices": [
   "−0.186 °C",
   "−0.372 °C",
   "−0.558 °C",
   "−0.744 °C"
  ],
  "answer": 2,
  "hint": "ΔTf = i·Kf·m. Count the ions per formula unit.",
  "solution": "CaCl₂ gives 3 ions, so ΔTf = (3)(1.86)(0.100) = 0.558 °C and the solution freezes at −0.558 °C. Answer: C."
 },
 {
  "id": "ai-01",
  "subject": "AI Olympiad",
  "topic": "Optimization",
  "title": "One gradient step",
  "statement": "Minimize f(w) = (w − 3)² with gradient descent, starting at w = 0 with learning rate 0.1. What is w after one step?",
  "choices": [
   "0.3",
   "0.6",
   "1.2",
   "3.0"
  ],
  "answer": 1,
  "hint": "w ← w − η·f′(w).",
  "solution": "f′(w) = 2(w − 3), so f′(0) = −6. w = 0 − 0.1(−6) = 0.6. Answer: B."
 },
 {
  "id": "ai-02",
  "subject": "AI Olympiad",
  "topic": "Neural networks",
  "title": "Sigmoid slope",
  "statement": "For the sigmoid σ(x) = 1/(1 + e⁻ˣ), what is σ′(0)?",
  "choices": [
   "0",
   "0.25",
   "0.5",
   "1"
  ],
  "answer": 1,
  "hint": "σ′(x) = σ(x)(1 − σ(x)).",
  "solution": "σ(0) = 0.5, so σ′(0) = 0.5 × 0.5 = 0.25. This is the largest the slope ever gets, which is one reason deep sigmoid networks suffer vanishing gradients. Answer: B."
 },
 {
  "id": "ai-03",
  "subject": "AI Olympiad",
  "topic": "Neural networks",
  "title": "Softmax",
  "statement": "A classifier outputs logits (0, ln 3) for two classes. What probability does softmax give the second class?",
  "choices": [
   "0.25",
   "0.50",
   "0.67",
   "0.75"
  ],
  "answer": 3,
  "hint": "Exponentiate each logit, then normalize.",
  "solution": "e⁰ = 1 and e^(ln 3) = 3, so the probabilities are 1/4 and 3/4. Answer: D."
 },
 {
  "id": "ai-04",
  "subject": "AI Olympiad",
  "topic": "Convolutional networks",
  "title": "Output size",
  "statement": "A 32×32 image passes through a convolution with a 5×5 kernel, stride 1 and no padding. What is the spatial size of the output?",
  "choices": [
   "27×27",
   "28×28",
   "30×30",
   "32×32"
  ],
  "answer": 1,
  "hint": "Output = (input − kernel + 2·padding)/stride + 1.",
  "solution": "(32 − 5 + 0)/1 + 1 = 28, so 28×28. Padding of 2 would keep it at 32×32. Answer: B."
 },
 {
  "id": "ai-05",
  "subject": "AI Olympiad",
  "topic": "Neural networks",
  "title": "Counting parameters",
  "statement": "How many trainable parameters does a fully connected layer with 100 inputs and 10 outputs have, including biases?",
  "choices": [
   "110",
   "1000",
   "1010",
   "1100"
  ],
  "answer": 2,
  "hint": "One weight per input-output pair, plus one bias per output.",
  "solution": "Weights: 100 × 10 = 1000. Biases: 10. Total 1010. Answer: C."
 },
 {
  "id": "ai-06",
  "subject": "AI Olympiad",
  "topic": "Evaluation",
  "title": "F1 score",
  "statement": "A classifier produces 30 true positives, 10 false positives and 20 false negatives. What is its F1 score (to three decimals)?",
  "choices": [
   "0.600",
   "0.667",
   "0.675",
   "0.750"
  ],
  "answer": 1,
  "hint": "F1 is the harmonic mean of precision and recall.",
  "solution": "Precision = 30/40 = 0.75. Recall = 30/50 = 0.60. F1 = 2(0.75)(0.60)/(0.75 + 0.60) = 0.667. Answer: B."
 },
 {
  "id": "ai-07",
  "subject": "AI Olympiad",
  "topic": "Generalization",
  "title": "Reading the curves",
  "statement": "A model reaches 99% training accuracy but 70% validation accuracy. Which change is most likely to help?",
  "choices": [
   "Train for more epochs",
   "Add more layers",
   "Add regularization or more training data",
   "Raise the learning rate"
  ],
  "answer": 2,
  "hint": "A large gap between training and validation accuracy has a name.",
  "solution": "The gap means the model is overfitting: it has memorized the training set. Regularization (weight decay, dropout, early stopping) or more data reduces variance; more capacity or more epochs makes it worse. Answer: C."
 },
 {
  "id": "ai-08",
  "subject": "AI Olympiad",
  "topic": "NumPy",
  "title": "Broadcasting",
  "statement": "In NumPy, a has shape (3, 1) and b has shape (1, 4). What is the shape of a + b?",
  "choices": [
   "(3, 4)",
   "(4, 3)",
   "(3, 1, 4)",
   "It raises an error"
  ],
  "answer": 0,
  "hint": "Compare the shapes dimension by dimension; a dimension of size 1 stretches to match.",
  "solution": "Dimension 0: 3 vs 1 → 3. Dimension 1: 1 vs 4 → 4. The result has shape (3, 4). Answer: A."
 },
 {
  "id": "ai-09",
  "subject": "AI Olympiad",
  "topic": "Loss functions",
  "title": "Cross-entropy",
  "statement": "A model assigns probability 0.5 to the correct class. What is the cross-entropy loss for that example, using natural logs?",
  "choices": [
   "0.301",
   "0.500",
   "0.693",
   "1.000"
  ],
  "answer": 2,
  "hint": "Loss = −ln(probability of the correct class).",
  "solution": "−ln(0.5) = ln 2 = 0.693. Answer: C."
 },
 {
  "id": "ai-10",
  "subject": "AI Olympiad",
  "topic": "Classical ML",
  "title": "Nearest neighbours",
  "statement": "Training points on a line: x = 1 (class A), 2 (A), 4 (B), 5 (B), 6 (B). Using 3-nearest-neighbours, what class is predicted for x = 3.4, and how many of the 3 neighbours agree?",
  "choices": [
   "A, with 2 of 3",
   "A, with 3 of 3",
   "B, with 2 of 3",
   "B, with 3 of 3"
  ],
  "answer": 2,
  "hint": "List the distance from 3.4 to every training point and take the three smallest.",
  "solution": "Distances: 2.4, 1.4, 0.6, 1.6, 2.6. The three nearest are x = 4 (B), x = 2 (A) and x = 5 (B), so the vote is B, 2 to 1. Answer: C."
 },
 {
  "id": "ai-11",
  "subject": "AI Olympiad",
  "topic": "Transformers",
  "title": "Attention cost",
  "statement": "How does the cost of standard self-attention grow with sequence length n?",
  "choices": [
   "O(log n)",
   "O(n)",
   "O(n log n)",
   "O(n²)"
  ],
  "answer": 3,
  "hint": "Every token attends to every token.",
  "solution": "Self-attention computes a score for each pair of positions, an n × n matrix, so time and memory grow as O(n²). This is why long contexts are expensive. Answer: D."
 },
 {
  "id": "ai-12",
  "subject": "AI Olympiad",
  "topic": "Linear algebra",
  "title": "Eigenvalues",
  "statement": "What are the eigenvalues of the matrix [[2, 1], [1, 2]]?",
  "choices": [
   "1 and 2",
   "1 and 3",
   "2 and 2",
   "0 and 4"
  ],
  "answer": 1,
  "hint": "Solve det(A − λI) = 0, or use trace and determinant.",
  "solution": "Trace = 4 and determinant = 3, so λ² − 4λ + 3 = 0 and λ = 1 or 3. Eigenvectors are (1, −1) and (1, 1). Answer: B."
 }
];
