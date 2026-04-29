import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeAvatar from "@/assets/Welcome intro.png";
import budgetAvatar from "@/assets/Budget prompt.png";
import categoryAvatar from "@/assets/Category prompt.png";
import conditionAvatar from "@/assets/Condition prompt.png";
import type { CategoryItem } from "../types";

type IntakeStep = "welcome" | "budget" | "categories" | "condition" | "ready";
type ConditionChoice = "New" | "Refurbished" | "Both";

const steps: IntakeStep[] = [
  "welcome",
  "budget",
  "categories",
  "condition",
  "ready",
];

const stepCopy: Record<
  IntakeStep,
  {
    eyebrow: string;
    title: string;
    body: string;
    avatar?: string;
    avatarAlt?: string;
  }
> = {
  welcome: {
    eyebrow: "PearlDeals assistant",
    title: "Hi, I am Naki.",
    body: "I will compare prices across trusted shops in Uganda and help you find products that fit within your budget...",
    avatar: welcomeAvatar,
    avatarAlt: "Naki waving to welcome shoppers",
  },
  budget: {
    eyebrow: "Step 1",
    title: "What budget should we work with?",
    body: "Enter the highest amount you want to spend. We will use it later to shape recommendations around deals that make sense for you.",
    avatar: budgetAvatar,
    avatarAlt: "Naki thinking about a shopping budget",
  },
  categories: {
    eyebrow: "Step 2",
    title: "What are you shopping for?",
    body: "Choose one or more categories. More categories will be added with time as PearlDeals grows.",
    avatar: categoryAvatar,
    avatarAlt: "Naki pointing at product categories",
  },
  condition: {
    eyebrow: "Step 3",
    title: "What condition should we look for?",
    body: "Tell Naki whether you prefer new products, refurbished deals, or both.",
    avatar: conditionAvatar,
    avatarAlt: "Naki presenting product condition choices",
  },
  ready: {
    eyebrow: "Ready",
    title: "Your shopping brief is set.",
    body: "Recommendation matching is coming next. For now, jump into the current deals page and start browsing live comparisons.",
  },
};

const conditionOptions: ConditionChoice[] = ["New", "Refurbished", "Both"];
const introPrefix = "Hi, I am ";
const introName = "Naki";
const introSuffix = ", your shopping assistant.";
const introText = `${introPrefix}${introName}${introSuffix}`;

export function LandingPage({
  categories,
  onBrowseDeals,
}: {
  categories: CategoryItem[];
  onBrowseDeals: () => void;
}) {
  const [activeStep, setActiveStep] = useState<IntakeStep>("welcome");
  const [budget, setBudget] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [condition, setCondition] = useState<ConditionChoice | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [typedIntroLength, setTypedIntroLength] = useState(0);

  const stepIndex = steps.indexOf(activeStep);
  const currentCopy = stepCopy[activeStep];

  const cleanBudget = useMemo(() => budget.replace(/[^\d]/g, ""), [budget]);
  const formattedBudget = useMemo(() => {
    if (!cleanBudget) return "";

    return new Intl.NumberFormat("en-UG").format(Number(cleanBudget));
  }, [cleanBudget]);
  const briefNote = useMemo(() => {
    if (activeStep === "budget") {
      return formattedBudget
        ? `Great, Naki will keep UGX ${formattedBudget} in mind while narrowing down deals.`
        : "Start with your budget so Naki can focus on products that fit your spending plan.";
    }

    if (activeStep === "categories") {
      if (selectedCategories.length === 0) {
        return "Pick the product areas you care about, and Naki will keep the search focused.";
      }

      if (selectedCategories.length === 1) {
        return `${selectedCategories[0]} it is. Naki will look for stronger matches in this category.`;
      }

      return `${selectedCategories.length} categories selected. Nice, Naki can compare a wider set of options for you.`;
    }

    if (activeStep === "condition") {
      return condition
        ? `${condition} selected. Naki will respect that preference when recommendations are added.`
        : "Choose the product condition that feels right for how you want to shop.";
    }

    if (activeStep === "ready") {
      return "Your shopping brief is ready. The next step is turning these answers into recommended deals.";
    }

    return "";
  }, [activeStep, condition, formattedBudget, selectedCategories]);

  const canGoBack = stepIndex > 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep !== "welcome") return;

    setTypedIntroLength(0);
    const intervalId = window.setInterval(() => {
      setTypedIntroLength((current) => {
        if (current >= introText.length) {
          window.clearInterval(intervalId);
          return current;
        }

        return current + 1;
      });
    }, 45);

    return () => window.clearInterval(intervalId);
  }, [activeStep]);

  const goToStep = (nextStep: IntakeStep) => {
    setValidationMessage("");
    setActiveStep(nextStep);
  };

  const goBack = () => {
    if (!canGoBack) return;
    goToStep(steps[stepIndex - 1]);
  };

  const validateCurrentStep = () => {
    if (activeStep === "budget" && Number(cleanBudget) <= 0) {
      setValidationMessage("Enter your budget before Naki continues.");
      return false;
    }

    if (activeStep === "categories" && selectedCategories.length === 0) {
      setValidationMessage("Choose at least one category.");
      return false;
    }

    if (activeStep === "condition" && !condition) {
      setValidationMessage("Choose a product condition.");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;

    if (activeStep === "ready") {
      onBrowseDeals();
      return;
    }

    goToStep(steps[stepIndex + 1]);
  };

  const toggleCategory = (category: string) => {
    setValidationMessage("");
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-5 text-gray-950 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-3xl font-bold">
            <span className="text-2xl">💸</span>
            <span className="inline-flex items-baseline gap-0">
              <span className="text-gray-900">Pearl</span>
              <span className="text-green-600">Deals</span>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 cursor-pointer rounded-full px-4 text-sm"
            onClick={onBrowseDeals}
          >
            Back to deals
          </Button>
        </header>

        <main
          className={`grid flex-1 items-center gap-5 ${
            activeStep === "welcome"
              ? "justify-items-center"
              : "lg:grid-cols-[1.05fr_0.95fr]"
          }`}
        >
          <section
            className={`rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm md:p-6 ${
              activeStep === "welcome" ? "w-full max-w-3xl" : ""
            }`}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <Sparkles className="h-4 w-4" />
                <span>{currentCopy.eyebrow}</span>
              </div>
              {activeStep !== "welcome" ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {stepIndex} of {steps.length - 1}
                </span>
              ) : null}
            </div>

            {activeStep === "welcome" ? (
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex w-full justify-center">
                  <div className="w-[72%] min-w-56 max-w-sm md:w-[58%]">
                    <img
                      src={welcomeAvatar}
                      alt={currentCopy.avatarAlt}
                      className="h-auto w-full object-contain object-center"
                    />
                  </div>
                </div>
                <div className="mt-1 max-w-2xl">
                  <h1 className="text-2xl font-bold tracking-normal text-gray-950 md:text-4xl">
                    {renderTypedIntro()}
                  </h1>
                  <p className="mt-3 text-base leading-7 text-gray-600 md:text-lg">
                    {currentCopy.body}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`mb-6 grid gap-4 sm:items-center ${
                  activeStep === "categories"
                    ? "sm:grid-cols-[1fr_7rem]"
                    : "sm:grid-cols-[7rem_1fr]"
                }`}
              >
                {currentCopy.avatar ? (
                  <div
                    className={`flex justify-center ${
                      activeStep === "categories"
                        ? "sm:order-2 sm:justify-end"
                        : "sm:justify-start"
                    }`}
                  >
                    <div className="h-28 w-28 overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
                      <img
                        src={currentCopy.avatar}
                        alt={currentCopy.avatarAlt}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  </div>
                ) : null}

                <div
                  className={`${currentCopy.avatar ? "" : "sm:col-span-2"} ${
                    activeStep === "categories" ? "sm:order-1" : ""
                  }`}
                >
                  <h1 className="text-3xl font-bold tracking-normal text-gray-950 md:text-5xl">
                    {currentCopy.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
                    {currentCopy.body}
                  </p>
                </div>
              </div>
            )}

            <div
              className={
                activeStep === "welcome"
                  ? "h-6"
                  : activeStep === "budget" || activeStep === "condition"
                    ? "min-h-[9rem]"
                    : "min-h-[16rem]"
              }
            >
              {renderStepContent()}
            </div>

            {validationMessage ? (
              <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {validationMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer rounded-full px-5"
                onClick={goBack}
                disabled={!canGoBack}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="button"
                className="h-11 cursor-pointer rounded-full bg-green-600 px-5 text-white hover:bg-green-700"
                onClick={goNext}
              >
                {activeStep === "ready"
                  ? "Show me deals"
                  : activeStep === "welcome"
                    ? "Start shopping"
                    : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {activeStep !== "welcome" ? (
            <aside className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-950">
                    Naki&apos;s brief
                  </h2>
                  <p className="text-sm text-gray-500">
                    Your answers will shape future recommendations.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <BriefRow
                  label="Budget"
                  value={formattedBudget ? `UGX ${formattedBudget}` : "Not set"}
                  active={activeStep === "budget"}
                />
                <BriefRow
                  label="Categories"
                  value={
                    selectedCategories.length > 0
                      ? selectedCategories.join(", ")
                      : "Not selected"
                  }
                  active={activeStep === "categories"}
                />
                <BriefRow
                  label="Condition"
                  value={condition || "Not selected"}
                  active={activeStep === "condition"}
                />
              </div>

              {briefNote ? (
                <div className="mt-6 rounded-3xl bg-gray-50 p-4">
                  <p className="text-sm leading-6 text-gray-600">{briefNote}</p>
                </div>
              ) : null}
            </aside>
          ) : null}
        </main>
      </div>
    </div>
  );

  function renderStepContent() {
    switch (activeStep) {
      case "welcome":
        return null;
      case "budget":
        return (
          <div className="max-w-2xl">
            <div>
              <label
                htmlFor="budget"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Budget in UGX
              </label>
              <div className="flex h-14 overflow-hidden rounded-2xl border border-gray-300 bg-white focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <div className="flex items-center border-r border-gray-200 bg-gray-50 px-4 text-sm font-bold text-green-700">
                  UGX
                </div>
                <Input
                  id="budget"
                  inputMode="numeric"
                  value={budget}
                  onChange={(event) => {
                    setValidationMessage("");
                    setBudget(event.target.value.replace(/[^\d]/g, ""));
                  }}
                  placeholder="Example: 850000"
                  className="h-full rounded-none border-0 bg-white px-4 text-lg focus-visible:ring-0"
                />
              </div>
              {formattedBudget ? (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Naki will work with UGX {formattedBudget}.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Enter numbers only. You can adjust this later.
                </p>
              )}
            </div>
          </div>
        );
      case "categories":
        return (
          <div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {categories.map((category) => {
                const selected = selectedCategories.includes(category.name);

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    className={`flex min-h-24 cursor-pointer flex-col items-start justify-between rounded-3xl border p-4 text-left transition ${
                      selected
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {category.name}
                      </span>
                      {selected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              More product categories will be added with time.
            </p>
          </div>
        );
      case "condition":
        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {conditionOptions.map((option) => {
              const selected = condition === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setValidationMessage("");
                    setCondition(option);
                  }}
                  className={`min-h-28 cursor-pointer rounded-3xl border p-4 text-left transition ${
                    selected
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="block text-base font-semibold text-gray-950">
                    {option}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-gray-600">
                    {option === "Both"
                      ? "Show new and refurbished options."
                      : `Focus on ${option.toLowerCase()} products.`}
                  </span>
                </button>
              );
            })}
          </div>
        );
      case "ready":
        return (
          <div className="rounded-3xl bg-gray-950 p-5 text-white">
            <p className="text-sm font-semibold text-green-300">
              Naki has your starting point.
            </p>
            <p className="mt-3 text-base leading-7 text-gray-200">
              Budget: {formattedBudget ? `UGX ${formattedBudget}` : "Not set"}.
              Categories:{" "}
              {selectedCategories.length > 0
                ? selectedCategories.join(", ")
                : "Not selected"}
              . Condition: {condition || "Not selected"}.
            </p>
          </div>
        );
    }
  }

  function renderTypedIntro() {
    const prefixText = introPrefix.slice(
      0,
      Math.min(typedIntroLength, introPrefix.length),
    );
    const nameLength = Math.max(
      0,
      Math.min(typedIntroLength - introPrefix.length, introName.length),
    );
    const suffixLength = Math.max(
      0,
      typedIntroLength - introPrefix.length - introName.length,
    );
    const nameText = introName.slice(0, nameLength);
    const suffixText = introSuffix.slice(0, suffixLength);
    const isTyping = typedIntroLength < introText.length;

    return (
      <>
        {prefixText}
        {nameText ? (
          <span className="font-[cursive] italic text-green-600">
            {nameText}
          </span>
        ) : null}
        {suffixText}
        {isTyping ? <span className="text-green-600">|</span> : null}
      </>
    );
  }
}

function BriefRow({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
        active
          ? "border-green-500 bg-green-50 shadow-sm"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <span
        className={`font-medium ${active ? "text-green-700" : "text-gray-500"}`}
      >
        {label}
      </span>
      <span
        className={`max-w-[11rem] text-right font-semibold ${
          active ? "text-green-800" : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
