import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { usePostHog } from "@posthog/react";
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronLeft,
  Grid2X2,
  Pencil,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import welcomeAvatar from "@/assets/Welcome intro.png";
import budgetAvatar from "@/assets/Budget prompt.png";
import categoryAvatar from "@/assets/Category prompt.png";
import conditionAvatar from "@/assets/Condition prompt.png";
import readyAvatar from "@/assets/Ready Prompt.png";
import type { CategoryItem, ConditionChoice, ShoppingBrief } from "../types";

type IntakeStep = "welcome" | "budget" | "categories" | "condition" | "ready";

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
    body: "Tell me your budget and what you need. I will help you find the best deals across trusted sites in Uganda.",
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
    body: "Pick everything you want to buy. You can choose up to three.",
    avatar: categoryAvatar,
    avatarAlt: "Naki pointing at product categories",
  },
  condition: {
    eyebrow: "Step 3",
    title: "What condition should we look for?",
    body: "Tell me whether you prefer new, refurbished, used, or all options.",
    avatar: conditionAvatar,
    avatarAlt: "Naki presenting product condition choices",
  },
  ready: {
    eyebrow: "Ready",
    title: "Your shopping brief is set.",
    body: "I will use this brief to recommend the best matching deals from the current PearlDeals list.",
    avatar: readyAvatar,
    avatarAlt: "Naki ready to show shopping deals",
  },
};

const conditionOptions: { label: ConditionChoice; description: string }[] = [
  {
    label: "New",
    description: "Brand-new, sealed, and usually warrantied.",
  },
  {
    label: "Refurbished",
    description: "Checked and restored for resale.",
  },
  {
    label: "Used",
    description: "Pre-owned and usually cheaper.",
  },
  {
    label: "All",
    description: "Compare every available option.",
  },
];
const budgetQuickChips = [
  { label: "100k", value: "100000" },
  { label: "300k", value: "300000" },
  { label: "500k", value: "500000" },
  { label: "1M", value: "1000000" },
];
const introPrefix = "Hi, I am ";
const introName = "Naki";
const introSuffix = ", your shopping assistant.";
const introText = `${introPrefix}${introName}${introSuffix}`;
const maxSelectedCategories = 3;
const maxSelectedConditions = 3;

export function LandingPage({
  categories,
  onBrowseDeals,
  onCompleteBrief,
  initialBrief,
  initialStep = "welcome",
}: {
  categories: CategoryItem[];
  onBrowseDeals: () => void;
  onCompleteBrief: (brief: ShoppingBrief) => void;
  initialBrief: ShoppingBrief | null;
  initialStep?: IntakeStep;
}) {
  const posthog = usePostHog();
  const [activeStep, setActiveStep] = useState<IntakeStep>(initialStep);
  const [budget, setBudget] = useState(
    initialBrief?.budget ? String(initialBrief.budget) : "",
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialBrief?.categories ?? [],
  );
  const [selectedConditions, setSelectedConditions] = useState<ConditionChoice[]>(
    initialBrief?.conditions ?? [],
  );
  const [validationMessage, setValidationMessage] = useState("");
  const [typedIntroLength, setTypedIntroLength] = useState(0);

  const stepIndex = steps.indexOf(activeStep);
  const currentCopy = stepCopy[activeStep];

  const cleanBudget = useMemo(() => budget.replace(/[^\d]/g, ""), [budget]);
  const formattedBudget = useMemo(() => {
    if (!cleanBudget) return "";

    return new Intl.NumberFormat("en-UG").format(Number(cleanBudget));
  }, [cleanBudget]);
  const conditionSummary = useMemo(() => {
    if (selectedConditions.length === 0) return "";
    if (selectedConditions.includes("All")) return "All conditions";

    return selectedConditions.join(", ");
  }, [selectedConditions]);

  const briefNote = useMemo(() => {
    if (activeStep === "budget") {
      return formattedBudget
        ? `Great, I will keep UGX ${formattedBudget} in mind while narrowing down deals.`
        : "Start with your budget so I can focus on products that fit your spending plan.";
    }

    if (activeStep === "categories") {
      if (selectedCategories.length === 0) {
        return "Pick the product areas you care about, and I will keep the search focused.";
      }

      if (selectedCategories.length === 1) {
        return `${selectedCategories[0]} it is. I will look for stronger matches in this category.`;
      }

      return `${selectedCategories.length} categories selected. Nice, we can compare a wider set of options for you.`;
    }

    if (activeStep === "condition") {
      return conditionSummary
        ? `${conditionSummary} selected. I will respect that preference when recommendations are added.`
        : "Choose the product conditions that feel right for how you want to shop.";
    }

    if (activeStep === "ready") {
      return "Your shopping brief is ready. I can now turn these answers into recommended deals.";
    }

    return "";
  }, [activeStep, conditionSummary, formattedBudget, selectedCategories]);

  const canGoBack = stepIndex > 0;

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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

  useEffect(() => {
    if (activeStep !== "ready") return;

    posthog.capture("shopping_brief_prompt_viewed", {
      step: "4_of_4",
      budget: Number(cleanBudget),
      categories: selectedCategories,
      category_count: selectedCategories.length,
      conditions: selectedConditions,
      condition_count: selectedConditions.length,
      all_conditions_selected: selectedConditions.includes("All"),
    });
  }, [activeStep, cleanBudget, posthog, selectedCategories, selectedConditions]);

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
      setValidationMessage("Enter your budget before we continue.");
      return false;
    }

    if (activeStep === "categories" && selectedCategories.length === 0) {
      setValidationMessage("Choose at least one category.");
      return false;
    }

    if (activeStep === "condition" && selectedConditions.length === 0) {
      setValidationMessage("Choose at least one product condition.");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;

    if (activeStep === "ready") {
      onCompleteBrief({
        budget: Number(cleanBudget),
        categories: selectedCategories,
        conditions: selectedConditions,
      });
      return;
    }

    goToStep(steps[stepIndex + 1]);
  };

  const toggleCategory = (category: string) => {
    setValidationMessage("");
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      if (current.length >= maxSelectedCategories) {
        setValidationMessage("You can choose up to three categories.");
        return current;
      }

      return [...current, category];
    });
  };

  const toggleCondition = (condition: ConditionChoice) => {
    setValidationMessage("");
    setSelectedConditions((current) => {
      if (condition === "All") {
        return current.includes("All") ? [] : ["All"];
      }

      const withoutAll = current.filter((item) => item !== "All");

      if (withoutAll.includes(condition)) {
        return withoutAll.filter((item) => item !== condition);
      }

      if (withoutAll.length >= maxSelectedConditions) {
        setValidationMessage("You can choose up to three conditions.");
        return current;
      }

      return [...withoutAll, condition];
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#f7fee7_34%,#f9fafb_62%)] px-4 py-5 text-gray-950 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="mb-6 flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onBrowseDeals}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 text-2xl font-bold sm:gap-2 sm:text-3xl"
            aria-label="Go to PearlDeals home"
          >
            <span className="text-xl sm:text-2xl" aria-hidden="true">
              {"\u{1F4B8}"}
            </span>
            <span className="inline-flex items-baseline gap-0">
              <span className="text-gray-900">Pearl</span>
              <span className="text-green-600">Deals</span>
            </span>
          </button>
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0 cursor-pointer rounded-full px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            onClick={onBrowseDeals}
          >
            Back to deals
          </Button>
        </header>

        <main
          className={`grid flex-1 gap-5 ${
            activeStep === "welcome"
              ? "items-start justify-items-center md:items-center"
              : "items-center lg:grid-cols-[1.05fr_0.95fr]"
          }`}
        >
          <section
            className={`rounded-[2rem] border border-emerald-900/10 bg-white/85 p-4 shadow-xl shadow-emerald-950/5 backdrop-blur md:p-6 ${
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
                  <div
                    key={activeStep}
                    className="naki-avatar-enter w-[72%] min-w-56 max-w-sm md:w-[58%]"
                  >
                    <img
                      src={welcomeAvatar}
                      alt={currentCopy.avatarAlt}
                      className="h-auto w-full object-contain object-center"
                    />
                  </div>
                </div>
                <div className="mt-1 max-w-2xl">
                  <h1 className="text-2xl font-black tracking-normal text-gray-950 md:text-4xl">
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
                        ? "order-2 sm:order-2 sm:justify-end"
                        : activeStep === "ready"
                          ? "order-2 sm:order-none sm:justify-start"
                          : "sm:justify-start"
                    }`}
                  >
                    <div key={activeStep} className="naki-avatar-enter h-28 w-28">
                      <img
                        src={currentCopy.avatar}
                        alt={currentCopy.avatarAlt}
                        className="h-full w-full object-contain object-center"
                      />
                    </div>
                  </div>
                ) : null}

                <div
                  className={`${currentCopy.avatar ? "" : "sm:col-span-2"} ${
                    activeStep === "categories"
                      ? "order-1 sm:order-1"
                      : activeStep === "ready"
                        ? "order-1 sm:order-none"
                        : ""
                  }`}
                >
                  <h1 className="text-3xl font-black tracking-normal text-gray-950 md:text-5xl">
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
                onClick={activeStep === "welcome" ? onBrowseDeals : goBack}
                disabled={activeStep !== "welcome" && !canGoBack}
              >
                {activeStep === "welcome" ? (
                  <Tags className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                {activeStep === "welcome" ? "View all deals first" : "Back"}
              </Button>

              <Button
                type="button"
                className="h-11 cursor-pointer rounded-full bg-gray-950 px-5 font-bold text-white hover:bg-emerald-700"
                onClick={goNext}
              >
                {activeStep === "ready"
                  ? "Show recommendations"
                  : activeStep === "welcome"
                    ? "Start shopping"
                    : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">
              Naki is not an AI assistant.
            </p>
          </section>

          {activeStep !== "welcome" ? (
            <aside className="rounded-[2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_34%),linear-gradient(145deg,#064e3b,#111827)] p-5 text-white shadow-xl shadow-emerald-950/10 md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-white">
                    Naki&apos;s brief
                  </h2>
                  <p className="text-sm text-emerald-50/70">
                    I will use this to find deals that fit your budget.
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
                  value={conditionSummary || "Not selected"}
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
                  I will work with UGX {formattedBudget}.
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Enter numbers only. You can adjust this later.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {budgetQuickChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => {
                      setValidationMessage("");
                      setBudget(chip.value);
                    }}
                    className={`h-9 cursor-pointer rounded-full border px-4 text-sm font-semibold transition ${
                      cleanBudget === chip.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "categories":
        return (
          <div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {categories.map((category) => {
                const selected = selectedCategories.includes(category.name);
                const capped =
                  !selected && selectedCategories.length >= maxSelectedCategories;

                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => toggleCategory(category.name)}
                    disabled={capped}
                    className={`flex min-h-24 cursor-pointer flex-col items-start justify-between rounded-3xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-950/5"
                        : capped
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60"
                        : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {category.name}
                      </span>
                      {selected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              More categories will be added with time as PearlDeals grows.
            </p>
          </div>
        );
      case "condition":
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {conditionOptions.map((option) => {
              const selected = selectedConditions.includes(option.label);

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => toggleCondition(option.label)}
                  className={`flex h-full min-h-28 cursor-pointer flex-col items-start rounded-3xl border p-4 text-left transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-950/5"
                      : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <span className="block min-h-6 text-base font-semibold leading-6 text-gray-950">
                    {option.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-gray-600">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        );
      case "ready":
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                  <Search className="h-[1.125rem] w-[1.125rem]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-5 text-gray-950">
                    Your search preferences
                  </h2>
                  <p className="text-xs leading-5 text-gray-700">
                    Ready to find your best deal
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              <PreferenceRow
                icon={<Briefcase className="h-5 w-5" />}
                label="Budget"
                onEdit={() => goToStep("budget")}
              >
                <span className="text-base font-semibold text-gray-950">
                  {formattedBudget ? `UGX ${formattedBudget}` : "Not set"}
                </span>
              </PreferenceRow>
              <PreferenceRow
                icon={<Grid2X2 className="h-5 w-5" />}
                label="Categories"
                onEdit={() => goToStep("categories")}
              >
                {selectedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category, index) => (
                      <span
                        key={category}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          index % 2 === 0
                            ? "bg-violet-100 text-violet-900"
                            : "bg-sky-100 text-sky-900"
                        }`}
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-base font-semibold text-gray-950">
                    Not selected
                  </span>
                )}
              </PreferenceRow>
              <PreferenceRow
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="Condition"
                onEdit={() => goToStep("condition")}
              >
                <span className="text-base font-semibold text-gray-950">
                  {conditionSummary || "Not selected"}
                </span>
              </PreferenceRow>
            </div>
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
          <span className="font-extrabold text-green-600">
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
          ? "border-amber-300 bg-amber-50 shadow-sm"
          : "border-white/10 bg-white/10"
      }`}
    >
      <span
        className={`font-medium ${active ? "text-amber-700" : "text-emerald-50/70"}`}
      >
        {label}
      </span>
      <span
        className={`max-w-[11rem] text-right font-semibold ${
          active ? "text-amber-900" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PreferenceRow({
  icon,
  label,
  children,
  onEdit,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-800">
            {label}
          </p>
          <div className="mt-1">{children}</div>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-8 w-16 cursor-pointer rounded-xl border-gray-300 px-2 text-xs font-semibold sm:h-9 sm:w-20 sm:px-3"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
    </div>
  );
}
