import React from "react";

const FilterToolbar = ({
    searchSlot,
    filtersSlot,
    showDivider = true,
    containerClassName = "bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-sm",
    dividerClassName = "h-4 w-px bg-gray-100 dark:border-border/50 mx-2 hidden md:block",
}) => {
    return (
        <div className={containerClassName}>
            {searchSlot}
            {showDivider ? <div className={dividerClassName} /> : null}
            {filtersSlot}
        </div>
    );
};

export default FilterToolbar;
