"use strict";

const bakeryProducts = [
  { id: "country-sourdough", name: "Country Sourdough", category: "Bread" },
  { id: "honey-oat", name: "Honey Oat", category: "Bread" },
  { id: "signature-loaf", name: "Signature Loaf", category: "Bread" },
  { id: "fruit-danish", name: "Seasonal Fruit Danish", category: "Pastry" },
  { id: "celebration-cake", name: "Celebration Cake", category: "Cake" }
];

const storageKeys = {
  favorites: "northStarBakeryFavorites",
  customer: "northStarBakeryCustomer"
};

const validationMessages = {
  nameRequired: "Please enter at least 2 characters for your name.",
  emailInvalid: "Enter a complete email address, such as name@example.com.",
  pickupRequired: "Choose a pickup date.",
  requestRequired: "Select pre-order or general question.",
  detailsShort: "Please provide at least 10 characters of item details."
};

function readJson(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function getProductById(productId) {
  return bakeryProducts.find((product) => product.id === productId);
}

function populateProductSelect(select) {
  bakeryProducts.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} - ${product.category}`;
    select.append(option);
  });
}

function renderFavorites(favoriteIds, list) {
  list.replaceChildren();
  favoriteIds.forEach((productId) => {
    const product = getProductById(productId);
    if (!product) return;
    const item = document.createElement("li");
    item.textContent = product.name;
    list.append(item);
  });
}

function initializeFavorites() {
  const select = document.querySelector("#favorite-product");
  if (!select) return;

  const list = document.querySelector("#favorites-list");
  const status = document.querySelector("#favorites-status");
  const addButton = document.querySelector("#add-favorite");
  const clearButton = document.querySelector("#clear-favorites");
  const storedFavorites = readJson(storageKeys.favorites, []);
  let favoriteIds = Array.isArray(storedFavorites)
    ? [...new Set(storedFavorites.filter((id) => getProductById(id)))]
    : [];

  populateProductSelect(select);
  renderFavorites(favoriteIds, list);
  status.textContent = favoriteIds.length
    ? `Restored ${favoriteIds.length} saved favorite${favoriteIds.length === 1 ? "" : "s"} from this browser.`
    : "Choose an item to start your saved favorites list.";

  addButton.addEventListener("click", () => {
    const productId = select.value;
    const product = getProductById(productId);
    if (!favoriteIds.includes(productId)) {
      favoriteIds.push(productId);
      const saved = writeJson(storageKeys.favorites, favoriteIds);
      renderFavorites(favoriteIds, list);
      status.textContent = saved
        ? `${product.name} was saved for your next visit.`
        : `${product.name} was added for this visit. Browser storage is unavailable.`;
    } else {
      status.textContent = `${product.name} is already in your saved list.`;
    }
  });

  clearButton.addEventListener("click", () => {
    favoriteIds = [];
    const saved = writeJson(storageKeys.favorites, favoriteIds);
    renderFavorites(favoriteIds, list);
    status.textContent = saved
      ? "Your saved favorites list was cleared."
      : "List cleared for this visit. Browser storage could not be updated.";
  });
}

function setFieldError(field, message) {
  const errorElement = document.querySelector(`#${field.id}-error`);
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", errorElement.id);
  errorElement.textContent = message;
}

function clearFieldError(field) {
  const errorElement = document.querySelector(`#${field.id}-error`);
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  errorElement.textContent = "";
}

function validateForm(form) {
  const name = form.elements.name;
  const email = form.elements.email;
  const pickupDate = form.elements["pickup-date"];
  const itemDetails = form.elements["item-details"];
  const selectedRequest = form.querySelector('input[name="request-type"]:checked');
  const requestError = document.querySelector("#request-type-error");
  const fields = [name, email, pickupDate, itemDetails];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let isValid = true;

  fields.forEach(clearFieldError);
  requestError.textContent = "";

  if (name.value.trim().length < 2) {
    setFieldError(name, validationMessages.nameRequired);
    isValid = false;
  }
  if (!emailPattern.test(email.value.trim())) {
    setFieldError(email, validationMessages.emailInvalid);
    isValid = false;
  }
  if (selectedRequest?.value === "pre-order" && !pickupDate.value) {
    setFieldError(pickupDate, validationMessages.pickupRequired);
    isValid = false;
  }
  if (!selectedRequest) {
    requestError.textContent = validationMessages.requestRequired;
    isValid = false;
  }
  if (itemDetails.value.trim().length < 10) {
    setFieldError(itemDetails, validationMessages.detailsShort);
    isValid = false;
  }

  if (!isValid) {
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
  }
  return isValid;
}

function restoreCustomerProfile(form) {
  const customer = readJson(storageKeys.customer, {});
  if (!customer || typeof customer !== "object" || Array.isArray(customer)) return;
  if (typeof customer.name === "string") form.elements.name.value = customer.name;
  if (typeof customer.email === "string") form.elements.email.value = customer.email;
}

function initializeForm() {
  const form = document.querySelector("#preorder-form");
  if (!form) return;

  const status = document.querySelector("#form-status");
  restoreCustomerProfile(form);
  const pickupDate = form.elements["pickup-date"];
  const requestOptions = Array.from(form.querySelectorAll('input[name="request-type"]'));
  function updatePickupRequirement() {
    pickupDate.required = form.querySelector('input[name="request-type"]:checked')?.value === "pre-order";
    if (!pickupDate.required) clearFieldError(pickupDate);
  }
  requestOptions.forEach((option) => option.addEventListener("change", updatePickupRequirement));
  updatePickupRequirement();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!validateForm(form)) {
      status.textContent = "Please correct the highlighted fields before sending your request.";
      return;
    }

    const customer = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim()
    };
    const saved = writeJson(storageKeys.customer, customer);
    status.textContent = saved
      ? "Your entries passed validation. Name and email saved for next time. This demo does not send requests to the bakery."
      : "Your entries passed validation. Browser storage is unavailable. This demo does not send requests to the bakery.";
  });
}

initializeFavorites();
initializeForm();
