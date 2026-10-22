import { SuitCategoryCodeModel } from "../models/Stock/SuitCategoryCode.Model.js";
import { StitchType } from "../enums/StitchType.js";
import { toStitchType } from "./Common.js";

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

const STITCH_TYPE_CODES = {
  [StitchType.UNSTITCHED]: "U",
  [StitchType.STITCHED]: "S",
};

export const toSkuPart = (value) =>
  String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const getCategoryCodeCandidates = (category) => {
  const letters = toSkuPart(category);
  if (!letters) {
    throw new Error(`Category "${category}" needs letters or digits for its SKU code`);
  }
  const consonants = [];
  for (const char of letters.slice(1)) {
    if (!VOWELS.has(char) && char !== consonants[consonants.length - 1]) {
      consonants.push(char);
    }
  }
  const primary = letters[0] + consonants.join("");
  const candidates = [
    primary.length >= 3 ? primary.slice(0, 3) : letters.slice(0, 3).padEnd(3, "X"),
  ];
  for (const char of letters.slice(2)) candidates.push(letters.slice(0, 2) + char);
  for (let number = 1; number <= 99; number++) {
    candidates.push(letters[0] + String(number).padStart(2, "0"));
  }
  return candidates;
};

export const buildCategoryCode = (category, takenCodes) => {
  const code = getCategoryCodeCandidates(category).find(
    (candidate) => !takenCodes.has(candidate)
  );
  if (!code) throw new Error(`No free SKU code left for category ${category}`);
  return code;
};

export const buildSuitSku = ({ categoryCode, d_no, color, stitch_type }) => {
  const colorPart = toSkuPart(color);
  if (!colorPart) {
    throw new Error(`Color "${color}" needs letters or digits for its SKU`);
  }
  return `${categoryCode}-${d_no}-${colorPart}-${STITCH_TYPE_CODES[toStitchType(stitch_type)]}`;
};

export const toBPairSku = (sku) => `${sku}-B`;

const getCategoryCode = async (category, session) => {
  const category_key = String(category).trim().toLowerCase();
  const saved = await SuitCategoryCodeModel.findOne({ category_key }).session(session);
  if (saved) return saved.code;

  const takenCodes = new Set(
    (await SuitCategoryCodeModel.find().select("code").session(session)).map(
      (item) => item.code
    )
  );
  const code = buildCategoryCode(category, takenCodes);
  await SuitCategoryCodeModel.create(
    [{ category_key, category: String(category).trim(), code }],
    { session }
  );
  return code;
};

export const getSuitSku = async ({ d_no, category, color, stitch_type, session }) =>
  buildSuitSku({
    categoryCode: await getCategoryCode(category, session),
    d_no,
    color,
    stitch_type,
  });

export const assertSkuFree = async (Model, sku, session) => {
  const owner = await Model.findOne({ sku }).select("d_no color").session(session);
  if (owner) {
    throw new Error(
      `SKU ${sku} is already used by D# ${owner.d_no} (${owner.color}). Use the same color name`
    );
  }
};
