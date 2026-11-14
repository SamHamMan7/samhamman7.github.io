// Key ideas per Chemistry Olympiad section (from my study guide) and the practice sources I use.
window.STUDY_NOTES={
 "Stoichiometry": [
  "Always convert to moles first; divide by the coefficient to find the limiting reactant.",
  "Two isotopes: average mass = m₁x + m₂(1 − x). Solve for x.",
  "Dilution: M₁V₁ = M₂V₂. Molarity is mol/L of solution; molality is mol/kg of solvent.",
  "Empirical formula: percent → grams → moles → divide by the smallest → whole numbers.",
  "Unknown element: use the product to find moles, then molar mass = mass/moles.",
  "Make the final units match what the question asks for, with nothing left over."
 ],
 "States of matter": [
  "Intermolecular forces: dispersion < dipole–dipole < hydrogen bonding (H on N, O or F). Stronger forces mean lower vapor pressure and higher boiling point.",
  "Ideal gas: PV = nRT; density d = PM/RT. Dalton: P(A) = X(A)·P(total).",
  "Effusion rate ∝ 1/√M. Average kinetic energy depends only on temperature.",
  "Unit cells: corner 1/8, edge 1/4, face 1/2, center 1. SC Z = 1 (a = 2r), BCC Z = 2 (a = 4r/√3), FCC Z = 4 (a = 4r/√2).",
  "Density from a unit cell: ρ = Z·M/(N_A·a³), with a in cm.",
  "Phase diagrams: lines are two phases in equilibrium; the triple point has all three. At a phase transition ΔG = 0.",
  "Colligative properties: ΔT = i·K·m."
 ],
 "Thermodynamics": [
  "ΔH°rxn = Σ ΔHf(products) − Σ ΔHf(reactants); elements in their standard states are zero.",
  "Hess’s law: reverse a step → flip the sign; multiply a step → multiply ΔH.",
  "Calorimetry: q = mcΔT; heat lost = heat gained. Constant volume (bomb) measures ΔE; constant pressure measures ΔH.",
  "Bond enthalpies: ΔH ≈ broken − formed.",
  "ΔG = ΔH − TΔS (match the units). ΔG° = −RT ln K. Spontaneous when ΔG < 0.",
  "Entropy: gas > liquid > solid; more moles of gas means higher S.",
  "Clausius–Clapeyron: ln(P₂/P₁) = −(ΔH/R)(1/T₂ − 1/T₁); the slope of ln P vs 1/T is −ΔH/R."
 ],
 "Kinetics": [
  "Orders come from experiment, or from the slow step of a mechanism, never from the overall equation.",
  "Units of k: M^(1−n)·s⁻¹ for overall order n.",
  "Integrated laws: zero order [A] = [A]₀ − kt; first ln[A] = ln[A]₀ − kt; second 1/[A] = 1/[A]₀ + kt.",
  "Half-lives: zero [A]₀/2k; first ln 2/k (constant); second 1/(k[A]₀).",
  "Arrhenius: k = A·e^(−Ea/RT); ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂). Only temperature and a catalyst change k.",
  "Catalyst: consumed then regenerated. Intermediate: produced then consumed."
 ],
 "Equilibrium and acids": [
  "Write K from the balanced equation; leave out pure solids and liquids.",
  "Le Châtelier: the system shifts to oppose a change. Pressure favors fewer moles of gas; heat is a product of an exothermic reaction; a catalyst shifts nothing.",
  "Weak acid: [H⁺] ≈ √(Ka·C). Buffer: pH = pKa + log([A⁻]/[HA]); at half-neutralization pH = pKa.",
  "Ksp with a common ion: the shared ion’s concentration is fixed by the other salt."
 ],
 "Bonding, redox and organic": [
  "E°cell = E°cathode − E°anode; ΔG° = −nFE°; a positive E° is spontaneous.",
  "VSEPR: count electron domains for the shape, then check whether bond dipoles cancel.",
  "Isomers: build each carbon skeleton, then place the functional group on each distinct carbon."
 ]
};
window.STUDY_SOURCES={
 "chem": [
  [
   "USNCO quizzes",
   "https://usnco-quizzes.web.app/",
   "Quiz yourself one question at a time.",
   "flask",
   "#1f9d63"
  ],
  [
   "Official past exams",
   "https://www.acs.org/education/olympiad/prepare-for-exams.html",
   "Every past local and national exam from the ACS, with answer keys.",
   "doc",
   "#2f6fd0"
  ],
  [
   "Chem ISODN",
   "https://chem.isodn.org/",
   "Guides and problem collections from the Olympiad community.",
   "atom",
   "#7a4fd6"
  ]
 ],
 "math": [
  [
   "AMC Trivial",
   "https://amctrivial.com/",
   "Real AMC, AIME and USA(J)MO problems with filters, answer checking and mock tests.",
   "sigma",
   "#e0562b"
  ]
 ],
 "sat": [
  [
   "Aniko",
   "https://www.aniko.ai/",
   "SAT practice questions, tests and a study plan.",
   "target",
   "#d9891a"
  ]
 ]
};
