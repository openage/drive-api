exports.toModel = (context) => {
    const pic = (item) => {
        item = item || {}
        return {
            url: item.url,
            thumbnail: item.thumbnail
        }
    }

    let result = {}

    if (context.tenant) {
        result.tenant = {
            id: context.tenant.id,
            code: context.tenant.code,
            name: context.tenant.name,
            logo: pic(context.tenant.logo)
        }
    }

    if (context.organization) {
        result.organization = {
            id: context.organization.id,
            code: context.organization.code,
            shortName: context.organization.shortName,
            name: context.organization.name,
            logo: pic(context.organization.logo),
            address: {}
        }

        if (context.organization.address) {
            result.organization.address = {
                line1: result.organization.address.line1,
                line2: result.organization.address.line2,
                district: result.organization.address.district,
                city: result.organization.address.city,
                state: result.organization.address.state,
                pinCode: result.organization.address.pinCode,
                country: result.organization.address.country
            }
        }
    }

    if (context.user) {
        result.user = {
            id: context.user.id,
            code: context.user.code,
            email: context.user.email,
            phone: context.user.phone,
            profile: {
                firstName: context.user.profile.firstName,
                lastName: context.user.profile.lastName,
                pic: pic(context.user.profile.pic)
            },
            role: {
                id: context.user.role.id,
                key: context.user.role.key
            }
        }
    }

    return result
}
