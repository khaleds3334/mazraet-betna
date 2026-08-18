/**
 * search.ts — matching what the admin types against what he's looking for.
 * Separate from `format.ts` (which shapes output) because this normalises input.
 *
 * The whole point of this file: the admin is looking for a person he knows, not
 * querying a database. He types fast, one-handed, standing up — he'll skip the
 * hamza, drop the «ال», write the two halves of a name as one word, or give them
 * in the wrong order. Every one of those has to still find the row, because when
 * it doesn't he concludes the customer isn't registered and adds them twice.
 */
import { toLatinDigits } from "./format";

/**
 * Arabic as it's typed, not as it's spelled: alef, ya, ta-marbuta and hamza
 * variants collapse to one form, tashkeel and tatweel disappear, and whitespace
 * becomes single spaces. Applied to both sides, so neither has to be "correct".
 */
function normalize(text: string): string {
  return text
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Drop the definite article from the start of every word, so «الشيخ احمد» and
 * «شيخ احمد» are the same person. Safe even where «ال» isn't an article («الياس»
 * → «ياس»), because both sides get the same treatment.
 */
function stripArticles(text: string): string {
  return text.replace(/(^|\s)ال/g, "$1");
}

const flatten = (text: string): string => text.replace(/\s+/g, "");

/**
 * Whether a person matches a typed query, by name or by phone — the rule behind
 * the customers screen's search box (A-30) and the add-order sheet's customer
 * picker (A-56).
 *
 * A query containing digits is read as a phone fragment, Arabic-Indic digits
 * included (`٠١٠` finds `010`). Otherwise it matches the name two ways, and either
 * is enough:
 *
 *   1. **Word by word**, articles ignored — every word typed has to appear
 *      somewhere in the name, in any order. Finds «احمد الخياط» in «الخياط احمد».
 *   2. **Spaces removed**, articles kept — finds «عبدالله» in «عبد الله» and the
 *      other way round.
 *
 * An empty query matches everyone, so a caller can filter unconditionally.
 */
export function matchesNameOrPhone(
  person: { name: string; phone: string },
  query: string,
): boolean {
  const typed = query.trim();
  if (!typed) return true;

  const digits = toLatinDigits(typed);
  if (digits) return person.phone.includes(digits);

  const name = normalize(person.name);
  const wanted = normalize(typed);

  const nameWords = stripArticles(name);
  const words = stripArticles(wanted).split(" ").filter(Boolean);
  if (words.length > 0 && words.every((word) => nameWords.includes(word))) {
    return true;
  }

  return flatten(name).includes(flatten(wanted));
}
