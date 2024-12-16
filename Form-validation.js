function Validator(options) {
    var selectorRules = {}; // Store validation rules

    // Function to validate an input element
    function validate(inputElement, rule) {
        var errorMessage;
        var errorElement = inputElement.parentElement.querySelector(options.errorSelector);

        // Get all rules for this selector
        var rules = selectorRules[rule.selector];
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    var checkedInputs = document.querySelectorAll(rule.selector + ':checked');
                    errorMessage = rules[i](checkedInputs.length > 0 ? 'checked' : '');
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break; // Stop at first error
        }

        // Show or hide error message
        if (errorMessage) {
            errorElement.innerText = errorMessage;
            inputElement.parentElement.classList.add('invalid');
            return false;
        } else {
            errorElement.innerText = '';
            inputElement.parentElement.classList.remove('invalid');
            return true;
        }
    }

    // Handle form submission
    var formElement = document.querySelector(options.form);
    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault();
            var isFormValid = true;

            // Validate all fields
            options.rules.forEach(function (rule) {
                var inputElements = formElement.querySelectorAll(rule.selector);
                inputElements.forEach(function (inputElement) {
                    var isValid = validate(inputElement, rule);
                    if (!isValid) {
                        isFormValid = false;
                    }
                });
            });

            // Submit if form is valid
            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {
                    var formValues = Array.from(formElement.querySelectorAll('[name]')).reduce(function (values, input) {
                        switch (input.type) {
                            case 'radio':
                            case 'checkbox':
                                if (input.checked) {
                                    values[input.name] = input.value;
                                }
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        };

        // Apply validation on blur and input events
        options.rules.forEach(function (rule) {
            if (!Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector] = [];
            }
            selectorRules[rule.selector].push(rule.test);

            var inputElements = formElement.querySelectorAll(rule.selector);
            inputElements.forEach(function (inputElement) {
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                };
                inputElement.oninput = function () {
                    var errorElement = inputElement.parentElement.querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    inputElement.parentElement.classList.remove('invalid');
                };
            });
        });
    }
}

// Rules for validation
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'This field is required';
        }
    };
};

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(value) ? undefined : message || 'Invalid email address';
        }
    };
};

Validator.minLength = function (selector, minLength, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= minLength ? undefined : message || `Minimum length is ${minLength} characters`;
        }
    };
};

Validator.isPasswordMatch = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Passwords do not match';
        }
    };
};
