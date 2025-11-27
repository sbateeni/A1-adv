import React from 'react';
import { LegalRegion } from '../../types';

interface RegionConfigProps {
    region: LegalRegion;
    handleRegionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RegionConfig: React.FC<RegionConfigProps> = ({ region, handleRegionChange }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border-s-4 border-amber-500">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">الاختصاص المكاني والقانوني</h2>
            <p className="text-gray-400 mb-4 text-sm">
                تختلف المرجعيات القانونية (خاصة المدنية والتجارية) بين الضفة الغربية وقطاع غزة.
                يرجى تحديد المنطقة الافتراضية لضمان دقة التحليل واستخدام القوانين الصحيحة (مثل المدني الأردني 1976 للضفة، أو المصري 1948 لغزة).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex-1 relative border rounded-lg p-4 cursor-pointer transition-all ${region === 'westbank' ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                    <div className="flex items-center">
                        <input 
                            type="radio" 
                            name="region" 
                            value="westbank" 
                            checked={region === 'westbank'} 
                            onChange={handleRegionChange}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                        />
                        <div className="ms-3">
                            <span className="block text-sm font-medium text-gray-200">الضفة الغربية</span>
                            <span className="block text-xs text-gray-400 mt-1">تطبق: القانون المدني الأردني 1976، أوامر عسكرية، قرارات بقانون.</span>
                        </div>
                    </div>
                </label>

                <label className={`flex-1 relative border rounded-lg p-4 cursor-pointer transition-all ${region === 'gaza' ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                    <div className="flex items-center">
                        <input 
                            type="radio" 
                            name="region" 
                            value="gaza" 
                            checked={region === 'gaza'} 
                            onChange={handleRegionChange}
                            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                        />
                        <div className="ms-3">
                            <span className="block text-sm font-medium text-gray-200">قطاع غزة</span>
                            <span className="block text-xs text-gray-400 mt-1">تطبق: القانون المدني المصري 1948، قوانين الانتداب، قرارات بقانون.</span>
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default RegionConfig;
