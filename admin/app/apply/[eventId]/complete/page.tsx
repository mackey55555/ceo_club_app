export default function CompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-3xl font-bold" style={{ color: '#243266' }}>
          申込み完了
        </h2>
        <p className="text-gray-600">
          イベントへの申込みを受け付けました。
          <br />
          確認メールをお送りしますので、ご確認ください。
        </p>
      </div>
    </div>
  );
}



