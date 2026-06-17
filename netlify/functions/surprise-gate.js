exports.handler = async (event, context) => {
    // Perform an atomic update: Update only if is_active is STILL true
    const { data, error } = await supabase
        .from('surprise_status')
        .update({ is_active: false })
        .eq('id', 1)
        .eq('is_active', true) // Only update if it's currently true
        .select(); // This returns the updated row if successful

    // If 'data' is empty, it means no row matched (it was already false)
    if (!data || data.length === 0) {
        return { statusCode: 302, headers: { Location: 'https://facebook.com/otwlimay' } };
    }

    // If 'data' exists, you successfully "claimed" the surprise!
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `...your surprise HTML...`
    };
};
