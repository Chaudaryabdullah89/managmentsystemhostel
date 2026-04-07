import React from "react";

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionSlot = null,
    iconWrapperClassName = "bg-gray-50 border-gray-100",
    iconClassName = "text-gray-400",
    containerClassName = "bg-white border border-gray-100 rounded-3xl p-24 text-center border-dashed shadow-sm",
}) => {
    return (
        <div className={containerClassName}>
            {Icon && (
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${iconWrapperClassName}`}>
                    <Icon className={`h-8 w-8 ${iconClassName}`} />
                </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                {title}
            </h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1 max-w-[320px] mx-auto leading-relaxed">
                {description}
            </p>
            {actionSlot ? <div className="mt-8">{actionSlot}</div> : null}
        </div>
    );
};

export default EmptyState;
