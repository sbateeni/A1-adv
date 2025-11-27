
import React from 'react';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import ServiceConfig from '../components/settings/ServiceConfig';
import DataManagement from '../components/settings/DataManagement';
import RegionConfig from '../components/settings/RegionConfig';

const SettingsPage: React.FC = () => {
    const {
        apiSource, handleApiSourceChange,
        region, handleRegionChange,
        geminiInputValue, setGeminiInputValue, handleSaveGeminiKey, geminiSaved,
        openRouterInputValue, setOpenRouterInputValue, handleSaveOpenRouterKey, openRouterSaved,
        openRouterModelId, handleModelChange, openRouterModels,
        newModelId, setNewModelId, newModelSupportsImages, setNewModelSupportsImages, handleAddModel, handleDeleteModel,
        casesCount, handleClearCases, handleExport, handleImportClick, handleFileChange, fileInputRef
    } = useSettingsLogic();

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-100 border-b border-gray-700 pb-3">الإعدادات</h1>
            
            <RegionConfig 
                region={region}
                handleRegionChange={handleRegionChange}
            />

            <ServiceConfig 
                apiSource={apiSource} handleApiSourceChange={handleApiSourceChange}
                geminiInputValue={geminiInputValue} setGeminiInputValue={setGeminiInputValue} handleSaveGeminiKey={handleSaveGeminiKey} geminiSaved={geminiSaved}
                openRouterInputValue={openRouterInputValue} setOpenRouterInputValue={setOpenRouterInputValue} handleSaveOpenRouterKey={handleSaveOpenRouterKey} openRouterSaved={openRouterSaved}
                openRouterModelId={openRouterModelId} handleModelChange={handleModelChange} openRouterModels={openRouterModels}
                newModelId={newModelId} setNewModelId={setNewModelId} newModelSupportsImages={newModelSupportsImages} setNewModelSupportsImages={setNewModelSupportsImages} handleAddModel={handleAddModel} handleDeleteModel={handleDeleteModel}
            />
            
            <DataManagement 
                casesCount={casesCount}
                handleExport={handleExport}
                handleImportClick={handleImportClick}
                handleClearCases={handleClearCases}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
            />
        </div>
    );
};

export default SettingsPage;
