/**
 * Medroute Interactive Health Calculators & Preventive Tools
 */

const MEDROUTE_CALCULATORS = {
  // 1. BMI CALCULATOR
  calculateBMI(heightCm, weightKg) {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
    const heightM = heightCm / 100;
    const bmi = +(weightKg / (heightM * heightM)).toFixed(1);

    let category = "";
    let colorClass = "";
    let advice = "";
    let minIdealWeight = +(18.5 * heightM * heightM).toFixed(1);
    let maxIdealWeight = +(24.9 * heightM * heightM).toFixed(1);

    if (bmi < 18.5) {
      category = "Underweight";
      colorClass = "text-sky-600 bg-sky-50 dark:bg-sky-950 dark:text-sky-300";
      advice = "Your BMI suggests you may be below the optimal weight range. Consider consulting our clinical nutritionist for nutrient-dense diet strategies.";
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = "Healthy / Optimal Weight";
      colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300";
      advice = "Excellent! You are within the healthy body mass range. Maintain your balanced nutrition, regular aerobic activity, and annual preventive screenings.";
    } else if (bmi >= 25.0 && bmi <= 29.9) {
      category = "Overweight";
      colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300";
      advice = "You are slightly above the recommended weight range. Modest lifestyle modifications like 30 minutes of daily brisk walking and fiber-rich meals can bring you to optimal levels.";
    } else {
      category = "Obesity Class";
      colorClass = "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300";
      advice = "A BMI in this range elevates cardiovascular and metabolic risks. We strongly recommend scheduling a consultation with our Endocrinology and Wellness specialists.";
    }

    return {
      bmi,
      category,
      colorClass,
      advice,
      idealWeightRange: `${minIdealWeight} kg - ${maxIdealWeight} kg`
    };
  },

  // 2. PREGNANCY DUE DATE CALCULATOR (Naegele's Rule)
  calculateDueDate(lmpDateString, cycleDays = 28) {
    if (!lmpDateString) return null;
    const lmp = new Date(lmpDateString);
    if (isNaN(lmp.getTime())) return null;

    // Standard formula: LMP + 280 days + (cycleDays - 28)
    const cycleAdjustment = (cycleDays - 28) * 24 * 60 * 60 * 1000;
    const dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000 + cycleAdjustment);

    const today = new Date();
    const diffTime = today.getTime() - lmp.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeksPregnant = Math.max(0, Math.floor(diffDays / 7));
    const daysPregnant = Math.max(0, diffDays % 7);

    let trimester = "First Trimester (Weeks 1 - 12)";
    let milestone = "Embryonic organ formation and heartbeat development.";

    if (weeksPregnant >= 13 && weeksPregnant <= 27) {
      trimester = "Second Trimester (Weeks 13 - 27)";
      milestone = "Rapid fetal growth, auditory response, and movement (quickening). Anomaly scan recommended at 18-20 weeks.";
    } else if (weeksPregnant >= 28) {
      trimester = "Third Trimester (Weeks 28 - 40+)";
      milestone = "Lung maturation, rapid weight gain, and positioning for delivery. Fortnightly obstetric checkups recommended.";
    }

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return {
      dueDateFormatted: dueDate.toLocaleDateString(undefined, options),
      weeksPregnant,
      daysPregnant,
      trimester,
      milestone
    };
  },

  // 3. DAILY CALORIE & WATER HYDRATION CALCULATOR
  calculateCalorieAndHydration(gender, age, weightKg, heightCm, activityLevel) {
    if (!age || !weightKg || !heightCm) return null;

    // Mifflin-St Jeor Equation for BMR
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,        // Little to no exercise
      light: 1.375,          // Light exercise 1-3 days/week
      moderate: 1.55,        // Moderate exercise 3-5 days/week
      active: 1.725          // Hard exercise 6-7 days/week
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    const maintenanceCalories = Math.round(bmr * multiplier);
    const weightLossCalories = Math.round(maintenanceCalories - 500);

    // Recommended daily water intake (approx 35 ml per kg of body weight)
    const waterLiters = +(weightKg * 0.035).toFixed(1);
    const waterGlasses = Math.round((waterLiters * 1000) / 250); // 250ml glass

    return {
      bmr: Math.round(bmr),
      maintenanceCalories,
      weightLossCalories,
      waterLiters,
      waterGlasses
    };
  },

  // 4. VACCINATION SCHEDULE DATABASE
  // Vaccine schedule data now lives in the single master file js/data.js (MEDROUTE_DATA.vaccines)
};
