import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useCategories } from '../Categories/CategoriesContext';
import useDebounce from '../../utils/hooks/useDebounce';
import { httpService } from '../../services/http/httpService';
import { useMapStore } from '../Map/store/map.store';
import { useTranslation } from 'react-i18next';

export const FiltersForm = () => {
    const { setCategories } = useCategories();
    const [selectedFilters, setSelectedFilters] = useState({});
    const [categoriesData, setCategoriesData] = useState([]);
    const mapConfiguration = useMapStore(state => state.mapConfiguration);
    const mapConfigDebounced = useDebounce(mapConfiguration, 5000);
    const { t } = useTranslation();

    useEffect(() => {
        if (mapConfigDebounced === null) {
            return;
        }
    }, [mapConfigDebounced]);

    const handleCheckboxChange = event => {
        const { value, checked } = event.target;
        const category = event.target.dataset.category;

        setCategories(prevSelectedFilters => {
            const newSelectedFilters = { ...prevSelectedFilters };

            if (checked) {
                if (newSelectedFilters[category]) {
                    newSelectedFilters[category].push(value);
                } else {
                    newSelectedFilters[category] = [value];
                }
            } else {
                newSelectedFilters[category] = newSelectedFilters[category].filter(
                    filter => filter !== value,
                );
            }

            return newSelectedFilters;
        });
    };

    useEffect(() => {
        const fetchCategories = async () => {
            const categoriesData = await httpService.getCategoriesData();
            setCategoriesData(categoriesData);
        };
        fetchCategories();
    }, []);

    const sections = categoriesData.map(filtersData => (
        <div
            key={`${filtersData[0][0]}-${filtersData[0][1]}`}
            aria-labelledby={`filter-label-${filtersData[0][0]}-${filtersData[0][1]}`}
        >
            <span id={`filter-label-${filtersData[0][0]}-${filtersData[0][1]}`}>
                {filtersData[0][1]}
            </span>
            {filtersData[1].map(([name, translation]) => (
                <div className="form-check" key={`${filtersData[0][0]}-${name}`}>
                    <label htmlFor={name}>
                        {translation}
                        <input
                            onChange={handleCheckboxChange}
                            className={`form-check-input filter`}
                            data-category={filtersData[0][0]}
                            type="checkbox"
                            id={name}
                            value={name}
                        />
                    </label>
                </div>
            ))}
        </div>
    ));

    useEffect(() => {
        const filterForm = document.querySelector("#filter-form form");
        if (!filterForm) return;

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.id = "clear-filters";
        clearBtn.className = "clear-filters-btn"; // Dodana klasa do stylizacji
        clearBtn.textContent = t("clearFilters"); // Tekst dynamiczny zależny od języka
        filterForm.appendChild(clearBtn);

        clearBtn.addEventListener("click", () => {
            const checkboxes = filterForm.querySelectorAll("input[type='checkbox']");
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    cb.click();
                }
            });
        });

        return () => {
            clearBtn.remove();
        };
    }, [categoriesData, t]);

    return <form>{sections}</form>;
};
