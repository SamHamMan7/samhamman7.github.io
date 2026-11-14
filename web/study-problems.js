// Original Chemistry Olympiad study questions and notes. Not official exam material.
window.STUDY_TOPICS={"Stoichiometry": ["Always convert to moles first; divide by the coefficient to find the limiting reactant.", "Two isotopes: average mass = m₁x + m₂(1 − x). Solve for x.", "Dilution: M₁V₁ = M₂V₂. Molarity is mol/L of solution; molality is mol/kg of solvent.", "Empirical formula: percent → grams → moles → divide by the smallest → whole numbers.", "Unknown element: use the product to find moles, then molar mass = mass/moles.", "Make the final units match what the question asks for, with nothing left over."], "States of matter": ["Intermolecular forces: dispersion < dipole–dipole < hydrogen bonding (H on N, O or F). Stronger forces mean lower vapor pressure and higher boiling point.", "Ideal gas: PV = nRT; density d = PM/RT. Dalton: P(A) = X(A)·P(total).", "Effusion rate ∝ 1/√M. Average kinetic energy depends only on temperature.", "Unit cells: corner 1/8, edge 1/4, face 1/2, center 1. SC Z = 1 (a = 2r), BCC Z = 2 (a = 4r/√3), FCC Z = 4 (a = 4r/√2).", "Density from a unit cell: ρ = Z·M/(N_A·a³), with a in cm.", "Phase diagrams: lines are two phases in equilibrium; the triple point has all three. At a phase transition ΔG = 0.", "Colligative properties: ΔT = i·K·m."], "Thermodynamics": ["ΔH°rxn = Σ ΔHf(products) − Σ ΔHf(reactants); elements in their standard states are zero.", "Hess’s law: reverse a step → flip the sign; multiply a step → multiply ΔH.", "Calorimetry: q = mcΔT; heat lost = heat gained. Constant volume (bomb) measures ΔE; constant pressure measures ΔH.", "Bond enthalpies: ΔH ≈ broken − formed.", "ΔG = ΔH − TΔS (match the units). ΔG° = −RT ln K. Spontaneous when ΔG < 0.", "Entropy: gas > liquid > solid; more moles of gas means higher S.", "Clausius–Clapeyron: ln(P₂/P₁) = −(ΔH/R)(1/T₂ − 1/T₁); the slope of ln P vs 1/T is −ΔH/R."], "Kinetics": ["Orders come from experiment, or from the slow step of a mechanism, never from the overall equation.", "Units of k: M^(1−n)·s⁻¹ for overall order n.", "Integrated laws: zero order [A] = [A]₀ − kt; first ln[A] = ln[A]₀ − kt; second 1/[A] = 1/[A]₀ + kt.", "Half-lives: zero [A]₀/2k; first ln 2/k (constant); second 1/(k[A]₀).", "Arrhenius: k = A·e^(−Ea/RT); ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂). Only temperature and a catalyst change k.", "Catalyst: consumed then regenerated. Intermediate: produced then consumed."], "Equilibrium and acids": ["Write K from the balanced equation; leave out pure solids and liquids.", "Le Châtelier: the system shifts to oppose a change. Pressure favors fewer moles of gas; heat is a product of an exothermic reaction; a catalyst shifts nothing.", "Weak acid: [H⁺] ≈ √(Ka·C). Buffer: pH = pKa + log([A⁻]/[HA]); at half-neutralization pH = pKa.", "Ksp with a common ion: the shared ion’s concentration is fixed by the other salt."], "Bonding, redox and organic": ["E°cell = E°cathode − E°anode; ΔG° = −nFE°; a positive E° is spontaneous.", "VSEPR: count electron domains for the shape, then check whether bond dipoles cancel.", "Isomers: build each carbon skeleton, then place the functional group on each distinct carbon."]};
window.STUDY_LINKS=[["Official past exams (ACS)", "https://www.acs.org/education/olympiad/prepare-for-exams.html"], ["Chem ISODN", "https://chem.isodn.org/"], ["USNCO quizzes", "https://usnco-quizzes.web.app/"]];
window.STUDY_PROBLEMS=[
 {
  "id": "st-01",
  "subject": "Stoichiometry",
  "topic": "Isotopes",
  "title": "Two isotopes of copper",
  "statement": "Copper has two stable isotopes, ⁶³Cu (62.93 u) and ⁶⁵Cu (64.93 u), and an average atomic mass of 63.55 u. What percent of copper atoms are ⁶³Cu?",
  "choices": [
   "31.0%",
   "50.0%",
   "69.0%",
   "75.0%"
  ],
  "answer": 2,
  "hint": "Let x be the fraction of the lighter isotope: 62.93x + 64.93(1 − x) = 63.55.",
  "solution": "62.93x + 64.93 − 64.93x = 63.55, so 2.00x = 1.38 and x = 0.690. 69.0% is ⁶³Cu. Answer: C."
 },
 {
  "id": "st-02",
  "subject": "Stoichiometry",
  "topic": "Limiting reactant",
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
  "solution": "Al: 5.40/26.98 = 0.200 mol. Cl₂: 10.65/70.90 = 0.1502 mol. Per coefficient: 0.200/2 = 0.100 and 0.1502/3 = 0.0501, so Cl₂ is limiting. AlCl₃ formed = 0.1502 × (2/3) = 0.1001 mol, and 0.1001 × 133.33 = 13.4 g. Answer: B."
 },
 {
  "id": "st-03",
  "subject": "Stoichiometry",
  "topic": "Molarity",
  "title": "Dilution",
  "statement": "What volume of 6.00 M HCl is needed to prepare 250. mL of 0.150 M HCl?",
  "choices": [
   "3.13 mL",
   "6.25 mL",
   "12.5 mL",
   "25.0 mL"
  ],
  "answer": 1,
  "hint": "Moles of solute do not change on dilution: M₁V₁ = M₂V₂.",
  "solution": "V₁ = (0.150)(250.)/6.00 = 6.25 mL. Answer: B."
 },
 {
  "id": "st-04",
  "subject": "Stoichiometry",
  "topic": "Unit conversion",
  "title": "Counting atoms",
  "statement": "How many hydrogen atoms are in 3.60 g of water (18.02 g/mol)?",
  "choices": [
   "1.20 × 10²³",
   "2.41 × 10²³",
   "3.61 × 10²³",
   "1.20 × 10²⁴"
  ],
  "answer": 1,
  "hint": "Grams → moles of H₂O → molecules → atoms. Each molecule has two H atoms.",
  "solution": "3.60/18.02 = 0.1998 mol H₂O. Molecules: 0.1998 × 6.022×10²³ = 1.203×10²³. H atoms: twice that, 2.41×10²³. Answer: B."
 },
 {
  "id": "st-05",
  "subject": "Stoichiometry",
  "topic": "Mass percent",
  "title": "Empirical formula",
  "statement": "A compound is 40.0% C, 6.71% H and 53.3% O by mass. What is its empirical formula?",
  "choices": [
   "CHO",
   "CH₂O",
   "C₂H₄O",
   "CH₄O"
  ],
  "answer": 1,
  "hint": "Assume 100 g, convert each mass to moles, then divide by the smallest.",
  "solution": "C: 40.0/12.01 = 3.33. H: 6.71/1.008 = 6.66. O: 53.3/16.00 = 3.33. Dividing by 3.33 gives 1 : 2 : 1, so CH₂O. Answer: B."
 },
 {
  "id": "st-06",
  "subject": "Stoichiometry",
  "topic": "Identify the element",
  "title": "Unknown carbonate",
  "statement": "Heating 2.00 g of a metal carbonate, MCO₃, drives off all its carbon as 0.880 g of CO₂ (44.01 g/mol). Which metal is M?",
  "choices": [
   "Mg",
   "Ca",
   "Sr",
   "Ba"
  ],
  "answer": 1,
  "hint": "Moles of CO₂ equal moles of MCO₃. Then find the molar mass of MCO₃ and subtract CO₃.",
  "solution": "0.880/44.01 = 0.0200 mol CO₂ = 0.0200 mol MCO₃. Molar mass = 2.00/0.0200 = 100.0 g/mol. Subtract CO₃ (60.01): M ≈ 40.0 g/mol, calcium. Answer: B."
 },
 {
  "id": "sm-01",
  "subject": "States of matter",
  "topic": "Gas laws",
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
  "id": "sm-02",
  "subject": "States of matter",
  "topic": "Partial pressure",
  "title": "Parts per million",
  "statement": "Air in a lab contains 250 ppm of CO by volume at a total pressure of 760. mmHg. What is the partial pressure of CO?",
  "choices": [
   "0.019 mmHg",
   "0.19 mmHg",
   "1.9 mmHg",
   "19 mmHg"
  ],
  "answer": 1,
  "hint": "For gases, volume fraction equals mole fraction. 250 ppm = 250 × 10⁻⁶.",
  "solution": "P(CO) = (250×10⁻⁶)(760.) = 0.19 mmHg. Answer: B."
 },
 {
  "id": "sm-03",
  "subject": "States of matter",
  "topic": "Effusion",
  "title": "Half the rate",
  "statement": "At the same temperature, which gas effuses about half as fast as methane, CH₄?",
  "choices": [
   "He",
   "O₂",
   "SO₂",
   "Xe"
  ],
  "answer": 2,
  "hint": "Rate is proportional to 1/√M. Half the rate means four times the molar mass.",
  "solution": "CH₄ is 16.0 g/mol, so the gas must be about 64 g/mol. SO₂ is 64.1 g/mol. Answer: C."
 },
 {
  "id": "sm-04",
  "subject": "States of matter",
  "topic": "Unit cells",
  "title": "Counting atoms in a cell",
  "statement": "In a cubic unit cell, X atoms sit at the corners and Y atoms at the centers of the faces. What is the formula of the compound?",
  "choices": [
   "XY",
   "XY₂",
   "XY₃",
   "X₃Y"
  ],
  "answer": 2,
  "hint": "A corner atom is shared by 8 cells; a face atom by 2.",
  "solution": "X: 8 × 1/8 = 1. Y: 6 × 1/2 = 3. The formula is XY₃. Answer: C."
 },
 {
  "id": "sm-05",
  "subject": "States of matter",
  "topic": "Unit cells",
  "title": "Density of copper",
  "statement": "Copper crystallizes in a face-centered cubic cell with an edge length of 361.5 pm. What is its density? (63.55 g/mol)",
  "choices": [
   "2.23 g/cm³",
   "4.47 g/cm³",
   "8.93 g/cm³",
   "17.9 g/cm³"
  ],
  "answer": 2,
  "hint": "ρ = Z·M/(N_A·a³), with Z = 4 for FCC. Convert pm to cm first.",
  "solution": "a = 3.615×10⁻⁸ cm, so a³ = 4.724×10⁻²³ cm³. ρ = (4)(63.55)/[(6.022×10²³)(4.724×10⁻²³)] = 8.93 g/cm³. Answer: C."
 },
 {
  "id": "sm-06",
  "subject": "States of matter",
  "topic": "Vapor pressure",
  "title": "Weakest attractions",
  "statement": "Which compound has the highest vapor pressure at 25 °C?",
  "choices": [
   "CH₃CH₂CH₂CH₃",
   "CH₃CH₂CH₂OH",
   "CH₃COCH₃",
   "HOCH₂CH₂OH"
  ],
  "answer": 0,
  "hint": "Weaker intermolecular forces mean more molecules escape into the vapor.",
  "solution": "Butane has only dispersion forces. Acetone adds dipole–dipole attractions, and the two alcohols hydrogen-bond (the diol most of all). Butane is the most volatile; it is a gas at 25 °C. Answer: A."
 },
 {
  "id": "sm-07",
  "subject": "States of matter",
  "topic": "Phase changes",
  "title": "Ice at its melting point",
  "statement": "Ice melts reversibly at 0 °C and 1 atm. Which set of signs is correct for the process?",
  "choices": [
   "ΔH > 0, ΔS > 0, ΔG = 0",
   "ΔH > 0, ΔS > 0, ΔG < 0",
   "ΔH < 0, ΔS > 0, ΔG < 0",
   "ΔH > 0, ΔS < 0, ΔG = 0"
  ],
  "answer": 0,
  "hint": "At the normal melting point the two phases are in equilibrium.",
  "solution": "Melting absorbs heat (ΔH > 0) and increases disorder (ΔS > 0). At exactly the melting point solid and liquid coexist, so ΔG = 0, which is why T = ΔH/ΔS there. Answer: A."
 },
 {
  "id": "sm-08",
  "subject": "States of matter",
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
  "id": "th-01",
  "subject": "Thermodynamics",
  "topic": "Hess’s law",
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
  "id": "th-02",
  "subject": "Thermodynamics",
  "topic": "Calorimetry",
  "title": "Mixing acid and base",
  "statement": "50.0 mL of 1.00 M HCl and 50.0 mL of 1.00 M NaOH, both at 22.00 °C, are mixed in a coffee-cup calorimeter. ΔH for neutralization is −56.0 kJ per mole of water formed. Treat the mixture as 100.0 g of water (4.184 J/g·°C). What is the final temperature?",
  "choices": [
   "25.35 °C",
   "28.69 °C",
   "33.38 °C",
   "35.38 °C"
  ],
  "answer": 1,
  "hint": "Heat released by the reaction = heat gained by the solution, q = mcΔT.",
  "solution": "Moles of water formed: 0.0500. Heat released: 0.0500 × 56.0 = 2.80 kJ = 2800 J. ΔT = 2800/[(100.0)(4.184)] = 6.69 °C. Final temperature = 22.00 + 6.69 = 28.69 °C. Answer: B."
 },
 {
  "id": "th-03",
  "subject": "Thermodynamics",
  "topic": "Enthalpy of formation",
  "title": "Which reaction defines ΔHf?",
  "statement": "For which reaction is ΔH°rxn equal to the standard enthalpy of formation of MgCO₃(s)?",
  "choices": [
   "MgO(s) + CO₂(g) → MgCO₃(s)",
   "Mg(s) + C(graphite) + 3/2 O₂(g) → MgCO₃(s)",
   "2 Mg(s) + 2 C(graphite) + 3 O₂(g) → 2 MgCO₃(s)",
   "Mg(s) + C(graphite) + 3 O(g) → MgCO₃(s)"
  ],
  "answer": 1,
  "hint": "A formation reaction makes exactly one mole of the compound from its elements in their standard states.",
  "solution": "Only the second equation forms 1 mol of MgCO₃ from elements in their standard states (solid Mg, graphite, O₂ gas). The first starts from compounds, the third makes 2 mol, and the fourth uses O atoms. Answer: B."
 },
 {
  "id": "th-04",
  "subject": "Thermodynamics",
  "topic": "Calorimetry",
  "title": "Bomb calorimeter",
  "statement": "A reaction is run in a sealed, rigid bomb calorimeter. The heat measured is equal to which quantity for the reaction?",
  "choices": [
   "ΔH",
   "ΔE (internal energy)",
   "ΔG",
   "The work done"
  ],
  "answer": 1,
  "hint": "What can a rigid container not do?",
  "solution": "At constant volume no pressure–volume work is done, so ΔE = q_v. ΔH equals the heat only at constant pressure; the two differ by Δ(PV), which matters when moles of gas change. Answer: B."
 },
 {
  "id": "th-05",
  "subject": "Thermodynamics",
  "topic": "Clausius–Clapeyron",
  "title": "Vapor pressure below the boiling point",
  "statement": "A liquid has a normal boiling point of 80.0 °C and ΔH°vap = 31.0 kJ/mol. What is its vapor pressure at 50.0 °C? (R = 8.314 J/mol·K)",
  "choices": [
   "0.188 atm",
   "0.375 atm",
   "0.620 atm",
   "0.850 atm"
  ],
  "answer": 1,
  "hint": "At the normal boiling point the vapor pressure is 1.00 atm. Use ln(P₂/P₁) = −(ΔH/R)(1/T₂ − 1/T₁) with kelvins.",
  "solution": "ln(P/1.00) = −(31,000/8.314)(1/323.15 − 1/353.15) = −(3729)(2.629×10⁻⁴) = −0.980. P = e^(−0.980) = 0.375 atm. Answer: B."
 },
 {
  "id": "th-06",
  "subject": "Thermodynamics",
  "topic": "Free energy and K",
  "title": "Reading K against temperature",
  "statement": "A reaction has K = 15 at 298 K, and K increases as the temperature rises. Which conclusions are valid? I. ΔG° < 0 at 298 K. II. ΔH° > 0.",
  "choices": [
   "I only",
   "II only",
   "Both I and II",
   "Neither I nor II"
  ],
  "answer": 2,
  "hint": "ΔG° = −RT ln K, and van ’t Hoff: K rises with T for an endothermic reaction.",
  "solution": "K > 1 means ln K > 0, so ΔG° = −RT ln K is negative: I is true. K growing with temperature means heat acts like a reactant, so the reaction is endothermic: II is true. Answer: C."
 },
 {
  "id": "th-07",
  "subject": "Thermodynamics",
  "topic": "Clausius–Clapeyron",
  "title": "Slope of ln P against 1/T",
  "statement": "A plot of ln(vapor pressure) against 1/T for a liquid is a straight line with slope −5200 K. What is ΔH°vap? (R = 8.314 J/mol·K)",
  "choices": [
   "5.20 kJ/mol",
   "26.0 kJ/mol",
   "43.2 kJ/mol",
   "62.5 kJ/mol"
  ],
  "answer": 2,
  "hint": "The slope of ln P vs 1/T is −ΔH/R.",
  "solution": "ΔH = −(slope)(R) = (5200)(8.314) = 43,200 J/mol = 43.2 kJ/mol. Answer: C."
 },
 {
  "id": "th-08",
  "subject": "Thermodynamics",
  "topic": "Gibbs free energy",
  "title": "When does it become spontaneous?",
  "statement": "A reaction has ΔH° = +40.0 kJ and ΔS° = +125 J/K. Above what temperature is it spontaneous under standard conditions?",
  "choices": [
   "0.320 K",
   "3.13 K",
   "320 K",
   "It is spontaneous at all temperatures"
  ],
  "answer": 2,
  "hint": "Set ΔG° = ΔH° − TΔS° = 0, and make the units match.",
  "solution": "T = ΔH°/ΔS° = 40,000 J / 125 J/K = 320 K. Above 320 K the −TΔS° term outweighs ΔH° and ΔG° < 0. Answer: C."
 },
 {
  "id": "th-09",
  "subject": "Thermodynamics",
  "topic": "Bond enthalpies",
  "title": "Estimating ΔH from bonds",
  "statement": "Bond dissociation enthalpies (kJ/mol): H–H 436, Cl–Cl 243, H–Cl 431. Estimate ΔH for H₂(g) + Cl₂(g) → 2 HCl(g).",
  "choices": [
   "−248 kJ",
   "−183 kJ",
   "+183 kJ",
   "+248 kJ"
  ],
  "answer": 1,
  "hint": "ΔH ≈ (bonds broken) − (bonds formed).",
  "solution": "Broken: 436 + 243 = 679 kJ. Formed: 2 × 431 = 862 kJ. ΔH ≈ 679 − 862 = −183 kJ. Answer: B."
 },
 {
  "id": "ki-01",
  "subject": "Kinetics",
  "topic": "Half-life",
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
  "id": "ki-02",
  "subject": "Kinetics",
  "topic": "Rate laws",
  "title": "Units of k",
  "statement": "For A + B → products, doubling [A] quadruples the rate and doubling [B] doubles the rate. What are the units of the rate constant?",
  "choices": [
   "s⁻¹",
   "M⁻¹·s⁻¹",
   "M⁻²·s⁻¹",
   "M·s⁻¹"
  ],
  "answer": 2,
  "hint": "Find each order first. The units of k are M^(1−n)·s⁻¹ for overall order n.",
  "solution": "Rate = k[A]²[B], third order overall. k = rate/([A]²[B]) has units (M/s)/M³ = M⁻²·s⁻¹. Answer: C."
 },
 {
  "id": "ki-03",
  "subject": "Kinetics",
  "topic": "Half-life",
  "title": "From half-life to k",
  "statement": "A first-order reaction has a half-life of 34.7 s. What is its rate constant?",
  "choices": [
   "0.0100 s⁻¹",
   "0.0200 s⁻¹",
   "0.0288 s⁻¹",
   "24.0 s⁻¹"
  ],
  "answer": 1,
  "hint": "For first order, t½ = ln 2 / k.",
  "solution": "k = 0.693/34.7 s = 0.0200 s⁻¹. Answer: B."
 },
 {
  "id": "ki-04",
  "subject": "Kinetics",
  "topic": "Activation energy",
  "title": "Doubling with ten degrees",
  "statement": "A rate constant doubles when the temperature rises from 300. K to 310. K. What is the activation energy? (R = 8.314 J/mol·K)",
  "choices": [
   "5.36 kJ/mol",
   "26.8 kJ/mol",
   "53.6 kJ/mol",
   "107 kJ/mol"
  ],
  "answer": 2,
  "hint": "ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂).",
  "solution": "ln 2 = (Ea/8.314)(1/300. − 1/310.) = (Ea/8.314)(1.075×10⁻⁴). Ea = (0.693)(8.314)/(1.075×10⁻⁴) = 53,600 J/mol = 53.6 kJ/mol. Answer: C."
 },
 {
  "id": "ki-05",
  "subject": "Kinetics",
  "topic": "Mechanisms",
  "title": "Catalyst or intermediate?",
  "statement": "Ozone is destroyed by the mechanism: Step 1: O₃ + Cl → ClO + O₂. Step 2: ClO + O → Cl + O₂. Which description is correct?",
  "choices": [
   "Cl is a catalyst and ClO is an intermediate",
   "Cl is an intermediate and ClO is a catalyst",
   "Both are catalysts",
   "Both are intermediates"
  ],
  "answer": 0,
  "hint": "A catalyst is used up and then regenerated; an intermediate is made and then used up.",
  "solution": "Cl is consumed in step 1 and regenerated in step 2, so it is a catalyst. ClO is produced in step 1 and consumed in step 2, so it is an intermediate. Neither appears in the overall reaction, O₃ + O → 2 O₂. Answer: A."
 },
 {
  "id": "ki-06",
  "subject": "Kinetics",
  "topic": "Rate constants",
  "title": "What changes k?",
  "statement": "Which change alters the value of the rate constant, k, for a gas-phase reaction?",
  "choices": [
   "Increasing a reactant concentration",
   "Adding an inert gas at constant volume",
   "Raising the temperature",
   "Doubling the container volume"
  ],
  "answer": 2,
  "hint": "Think of the Arrhenius equation: what does k depend on?",
  "solution": "k = A·e^(−Ea/RT) depends only on temperature and on the pathway (a catalyst changes Ea). Concentration, volume and inert gases change the rate at most, never k. Answer: C."
 },
 {
  "id": "ki-07",
  "subject": "Kinetics",
  "topic": "Integrated rate laws",
  "title": "Second-order decay",
  "statement": "A second-order reaction has k = 0.500 M⁻¹·s⁻¹ and an initial concentration of 0.100 M. What is the concentration after 20.0 s?",
  "choices": [
   "0.0250 M",
   "0.0368 M",
   "0.0500 M",
   "0.0900 M"
  ],
  "answer": 2,
  "hint": "For second order, 1/[A] = kt + 1/[A]₀.",
  "solution": "1/[A] = (0.500)(20.0) + 1/0.100 = 10.0 + 10.0 = 20.0 M⁻¹, so [A] = 0.0500 M. Answer: C."
 },
 {
  "id": "eq-01",
  "subject": "Equilibrium and acids",
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
  "id": "eq-02",
  "subject": "Equilibrium and acids",
  "topic": "Le Châtelier",
  "title": "Making more ammonia",
  "statement": "N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) is exothermic. Which change increases the equilibrium amount of NH₃?",
  "choices": [
   "Raising the temperature",
   "Decreasing the container volume",
   "Adding a catalyst",
   "Removing some H₂"
  ],
  "answer": 1,
  "hint": "Compare moles of gas on each side, and treat heat as a product.",
  "solution": "A smaller volume raises the pressure, and the system shifts toward fewer moles of gas (4 → 2), making more NH₃. Heating shifts an exothermic reaction left, a catalyst does not move the equilibrium, and removing H₂ shifts it left. Answer: B."
 },
 {
  "id": "eq-03",
  "subject": "Equilibrium and acids",
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
  "id": "eq-04",
  "subject": "Equilibrium and acids",
  "topic": "Buffers",
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
  "id": "eq-05",
  "subject": "Equilibrium and acids",
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
  "id": "bo-01",
  "subject": "Bonding, redox and organic",
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
  "id": "bo-02",
  "subject": "Bonding, redox and organic",
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
  "id": "bo-03",
  "subject": "Bonding, redox and organic",
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
 }
];
